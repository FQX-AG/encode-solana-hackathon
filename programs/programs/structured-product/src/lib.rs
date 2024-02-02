use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::Metadata;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};
use spl_token_2022::instruction::TokenInstruction;

use transfer_snapshot_hook::program::TransferSnapshotHook;
use transfer_snapshot_hook::{SnapshotConfig, SnapshotTokenAccountBalances};
use treasury_wallet::program::TreasuryWallet;
use treasury_wallet::TreasuryWalletAccount;

declare_id!("GYFmKqbpYHUrML3BstU9VUnVdEE6ho9tzVJzs1DAR5iz");

#[error_code]
pub enum StructuredProductError {
    #[msg("Invalid owner")]
    InvalidOwner,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Payment amount already Set")]
    PaymentAmountAlreadySet,
    #[msg("Payment amount not set")]
    PaymentAmountNotSet,
    #[msg("Already paid")]
    AlreadyPaid,
    #[msg("Issuance not paid for")]
    Unpaid,
    #[msg("Already issued")]
    AlreadyIssued,
    #[msg("Date not in past")]
    DateNotInPast,
    #[msg("Date not in future")]
    DateNotInFuture,
    #[msg("Invalid date")]
    InvalidPaymentDate,
    #[msg("Principal undefined")]
    PrincipalUndefined,
    #[msg("Insufficient balance")]
    InsufficientBalance,
}

#[program]
pub mod structured_product {
    use anchor_spl::metadata::mpl_token_metadata::instructions::{
        CreateV1Cpi, CreateV1CpiAccounts, CreateV1InstructionArgs,
    };
    use anchor_spl::metadata::mpl_token_metadata::types::TokenStandard::Fungible;
    use anchor_spl::token_2022;
    use solana_program::instruction::Instruction;
    use spl_token_2022::check_spl_token_program_account;

    use treasury_wallet::cpi::accounts::Withdraw;

    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        max_snapshots: u8,
        payment_amount_per_unit: u64,
        supply: u64,
    ) -> Result<()> {
        let init_transfer_hook_instruction =
            token_2022::spl_token_2022::extension::transfer_hook::instruction::initialize(
                &ctx.accounts.token_program.key(),
                &ctx.accounts.mint.key(),
                Some(ctx.accounts.structured_product.key()),
                Some(ctx.accounts.snapshot_transfer_hook_program.key()),
            )?;

        let mint_key = ctx.accounts.mint.key();

        let signer_seeds = &[mint_key.as_ref(), &[ctx.bumps.structured_product]];

        msg!("Init transfer hook on mint");
        solana_program::program::invoke_signed(
            &init_transfer_hook_instruction,
            &[
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.structured_product.to_account_info(),
            ],
            &[&signer_seeds[..]],
        )?;

        msg!("Init extra account meta list");
        let cpi_accounts = transfer_snapshot_hook::cpi::accounts::InitializeExtraAccountMetaList {
            extra_account: ctx.accounts.extra_account.clone(),
            snapshot_config: ctx.accounts.snapshot_config.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            payer: ctx.accounts.issuer.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };

        transfer_snapshot_hook::cpi::initialize_extra_account_meta_list(CpiContext::new(
            ctx.accounts
                .snapshot_transfer_hook_program
                .to_account_info(),
            cpi_accounts,
        ))?;

        msg!("Init mint");
        let intialize_mint_accounts = token_2022::InitializeMint2 {
            mint: ctx.accounts.mint.to_account_info(),
        };

        token_2022::initialize_mint2(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                intialize_mint_accounts,
                &[&signer_seeds[..]],
            ),
            0,
            &ctx.accounts.structured_product.key(),
            None,
        )?;

        msg!("Init snapshot config");
        let cpi_accounts = transfer_snapshot_hook::cpi::accounts::Initialize {
            mint: ctx.accounts.mint.to_account_info(),
            payer: ctx.accounts.issuer.to_account_info(),
            snapshot_config: ctx.accounts.snapshot_config.to_account_info(),
            authority: ctx.accounts.structured_product.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };

        transfer_snapshot_hook::cpi::initialize(
            CpiContext::new_with_signer(
                ctx.accounts
                    .snapshot_transfer_hook_program
                    .to_account_info(),
                cpi_accounts,
                &[&signer_seeds[..]],
            ),
            max_snapshots,
        )?;

        msg!("Init structured product");
        let structured_product = &mut ctx.accounts.structured_product;
        structured_product.authority = ctx.accounts.authority.key();
        structured_product.investor = ctx.accounts.investor.key();
        structured_product.issuer = ctx.accounts.issuer.key();
        structured_product.issuer_treasury_wallet = ctx.accounts.issuer_treasury_wallet.key();
        structured_product.issuance_payment_mint = ctx.accounts.payment_mint.key();
        structured_product.issuance_payment_amount_per_unit = payment_amount_per_unit;
        structured_product.supply = supply;
        structured_product.num_payments = 0;
        structured_product.principal_defined = false;
        structured_product.issuance_date = None;
        structured_product.bump = ctx.bumps.structured_product;

        Ok(())
    }

    pub fn add_static_payment(
        ctx: Context<AddStaticPayment>,
        principal: bool,
        payment_date_offset: i64,
        price_per_unit: u64,
    ) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.structured_product.authority.key(),
            StructuredProductError::Unauthorized
        );
        require!(
            ctx.accounts.structured_product.issuance_date.is_none(),
            StructuredProductError::AlreadyIssued
        );

        // TODO refactor duplicated code into macro or function
        if principal {
            require!(
                ctx.accounts.snapshot_config.snapshots
                    [ctx.accounts.snapshot_config.defined_snapshots as usize - 1]
                    == payment_date_offset,
                StructuredProductError::InvalidPaymentDate
            )
        }

        let cpi_program = ctx
            .accounts
            .snapshot_transfer_hook_program
            .to_account_info();

        let cpi_accounts = transfer_snapshot_hook::cpi::accounts::DefineSnapshot {
            snapshot_config: ctx.accounts.snapshot_config.to_account_info(),
            authority: ctx.accounts.structured_product.to_account_info(),
        };

        // Assuming that principal payment is always at the same snapshot as the previous
        // We only create snapshots for non-principal payments
        if !principal {
            let mint_key = ctx.accounts.mint.key();
            let signer_seeds = &[mint_key.as_ref(), &[ctx.accounts.structured_product.bump]];

            transfer_snapshot_hook::cpi::define_snapshot(
                CpiContext::new_with_signer(
                    cpi_program.clone(),
                    cpi_accounts,
                    &[&signer_seeds[..]],
                ),
                payment_date_offset,
            )?;
        }

        let payment = &mut ctx.accounts.payment;
        payment.principal = principal;
        payment.price_authority = None;
        payment.price_per_unit = Some(price_per_unit);
        payment.payment_mint = ctx.accounts.payment_mint.key();
        payment.paid = false;
        payment.bump = ctx.bumps.payment;

        let structured_product = &mut ctx.accounts.structured_product;
        structured_product.num_payments += 1;
        if principal {
            structured_product.principal_defined = true;
        }

        Ok(())
    }

    pub fn add_variable_payment(
        ctx: Context<AddVariablePayment>,
        principal: bool,
        payment_date_offset: i64,
    ) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.structured_product.authority.key(),
            StructuredProductError::Unauthorized
        );
        // Simple assumption that principal is last payment
        require!(
            !ctx.accounts.structured_product.principal_defined,
            StructuredProductError::Unauthorized
        );
        require!(
            ctx.accounts.structured_product.issuance_date.is_none(),
            StructuredProductError::AlreadyIssued
        );

        if principal {
            require!(
                ctx.accounts.snapshot_config.snapshots
                    [ctx.accounts.snapshot_config.defined_snapshots as usize - 1]
                    == payment_date_offset,
                StructuredProductError::InvalidPaymentDate
            )
        }

        let cpi_program = ctx
            .accounts
            .snapshot_transfer_hook_program
            .to_account_info();

        let cpi_accounts = transfer_snapshot_hook::cpi::accounts::DefineSnapshot {
            snapshot_config: ctx.accounts.snapshot_config.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };

        // Assuming that principal payment is always at the same snapshot as the previous
        // We only create snapshots for non-principal payments
        if !principal {
            let mint_key = ctx.accounts.mint.key();
            let signer_seeds = &[mint_key.as_ref(), &[ctx.accounts.structured_product.bump]];

            transfer_snapshot_hook::cpi::define_snapshot(
                CpiContext::new_with_signer(
                    cpi_program.clone(),
                    cpi_accounts,
                    &[&signer_seeds[..]],
                ),
                payment_date_offset,
            )?;
        }

        let payment = &mut ctx.accounts.payment;
        payment.principal = principal;
        payment.price_authority = Some(ctx.accounts.price_authority.key());
        payment.payment_mint = ctx.accounts.payment_mint.key();
        payment.paid = false;
        payment.bump = ctx.bumps.payment;

        let structured_product = &mut ctx.accounts.structured_product;
        structured_product.num_payments += 1;
        if principal {
            structured_product.principal_defined = true;
        }

        Ok(())
    }

    pub fn pay_issuance(ctx: Context<PayIssuance>) -> Result<()> {
        require!(
            !ctx.accounts.structured_product.paid,
            StructuredProductError::AlreadyPaid
        );

        let cpi_program = ctx.accounts.token_program.to_account_info();

        let cpi_accounts = token_2022::TransferChecked {
            from: ctx.accounts.payer_token_account.to_account_info(),
            to: ctx
                .accounts
                .structured_product_token_account
                .to_account_info(),
            mint: ctx.accounts.payment_mint.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        };

        token_2022::transfer_checked(
            CpiContext::new(cpi_program, cpi_accounts),
            ctx.accounts.structured_product.supply
                * ctx
                    .accounts
                    .structured_product
                    .issuance_payment_amount_per_unit,
            ctx.accounts.payment_mint.decimals,
        )?;

        let structured_product = &mut ctx.accounts.structured_product;
        structured_product.paid = true;
        Ok(())
    }

    pub fn create_metadata(
        ctx: Context<CreateMetadata>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.structured_product.authority.key(),
            StructuredProductError::Unauthorized
        );
        let cpi_program = ctx.accounts.metadata_program.to_account_info();
        let cpi_accounts = CreateV1CpiAccounts {
            metadata: &ctx.accounts.metadata.to_account_info(),
            master_edition: None,
            sysvar_instructions: &ctx.accounts.sys_var.to_account_info(),
            spl_token_program: &ctx.accounts.token_program.to_account_info(),
            update_authority: (&ctx.accounts.structured_product.to_account_info(), true),
            mint: (&ctx.accounts.mint.to_account_info(), false),
            payer: &ctx.accounts.authority.to_account_info(),
            system_program: &ctx.accounts.system_program.to_account_info(),
            authority: &ctx.accounts.structured_product.to_account_info(),
        };

        msg!("Creating metadata");
        msg!("Name: {}", name);
        msg!("Symbol: {}", symbol);
        msg!("Uri: {}", uri);
        let create_v1_cpi = CreateV1Cpi::new(
            &cpi_program,
            cpi_accounts,
            CreateV1InstructionArgs {
                name,
                symbol,
                uri,
                seller_fee_basis_points: 0,
                creators: None,
                primary_sale_happened: true,
                is_mutable: false,
                token_standard: Fungible,
                collection: None,
                decimals: Some(0),
                collection_details: None,
                print_supply: None,
                rule_set: None,
                uses: None,
            },
        );

        let mint_key = ctx.accounts.mint.key();
        let signer_seeds = &[mint_key.as_ref(), &[ctx.accounts.structured_product.bump]];

        create_v1_cpi.invoke_signed(&[&signer_seeds[..]])?;

        Ok(())
    }

    pub fn issue(ctx: Context<Issue>) -> Result<()> {
        require!(
            ctx.accounts.issuer.key() == ctx.accounts.structured_product.issuer.key(),
            StructuredProductError::Unauthorized
        );
        require!(
            ctx.accounts.structured_product.principal_defined,
            StructuredProductError::PrincipalUndefined
        );
        require!(
            ctx.accounts.structured_product.issuance_date.is_none(),
            StructuredProductError::Unauthorized
        );
        require!(
            ctx.accounts.structured_product.paid,
            StructuredProductError::Unpaid
        );

        let mint_key = ctx.accounts.mint.key();
        let signer_seeds = &[mint_key.as_ref(), &[ctx.accounts.structured_product.bump]];

        let token_program = ctx.accounts.token_program.to_account_info();

        let cpi_accounts = token_2022::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.program_token_account.to_account_info(),
            authority: ctx.accounts.structured_product.to_account_info(),
        };

        // TODO: Have to mint to program account first
        token_2022::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                &[&signer_seeds[..]],
            ),
            ctx.accounts.structured_product.supply,
        )?;

        msg!("Minted tokens");

        msg!("Creating investors snapshot balances account");

        let snapshot_program = &ctx.accounts.snapshot_transfer_hook_program;

        let cpi_accounts = transfer_snapshot_hook::cpi::accounts::InitSnapshotBalancesAccount {
            snapshot_config: ctx.accounts.snapshot_config.to_account_info(),
            snapshot_balances: ctx
                .accounts
                .investor_token_snapshot_balances_account
                .to_account_info(),
            owner: ctx.accounts.investor.to_account_info(),
            token_account: ctx.accounts.investor_token_account.to_account_info(),
            payer: ctx.accounts.investor.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };

        transfer_snapshot_hook::cpi::init_snapshot_balances_account(CpiContext::new(
            snapshot_program.to_account_info(),
            cpi_accounts,
        ))?;

        msg!("Creating program snapshot balances account");

        let cpi_accounts = transfer_snapshot_hook::cpi::accounts::InitSnapshotBalancesAccount {
            snapshot_config: ctx.accounts.snapshot_config.to_account_info(),
            snapshot_balances: ctx
                .accounts
                .program_token_snapshot_balances_account
                .to_account_info(),
            owner: ctx.accounts.structured_product.to_account_info(),
            token_account: ctx.accounts.program_token_account.to_account_info(),
            payer: ctx.accounts.issuer.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };

        transfer_snapshot_hook::cpi::init_snapshot_balances_account(CpiContext::new(
            snapshot_program.to_account_info(),
            cpi_accounts,
        ))?;

        msg!("Activating snapshot hook program");
        let cpi_accounts = transfer_snapshot_hook::cpi::accounts::ActivateSnapshots {
            snapshot_config: ctx.accounts.snapshot_config.to_account_info(),
            authority: ctx.accounts.structured_product.to_account_info(),
        };

        transfer_snapshot_hook::cpi::activate(CpiContext::new_with_signer(
            snapshot_program.to_account_info(),
            cpi_accounts,
            &[&signer_seeds[..]],
        ))?;

        // TODO: This could probably be done with less manual work using spl transfer_checked and tlv account resolution
        msg!("Building transfer_checked ix!");
        check_spl_token_program_account(&ctx.accounts.token_program.key())?;
        let data = TokenInstruction::TransferChecked {
            amount: ctx.accounts.structured_product.supply,
            decimals: 0,
        }
        .pack();

        let accounts = vec![
            AccountMeta::new(ctx.accounts.program_token_account.key(), false),
            AccountMeta::new_readonly(ctx.accounts.mint.key(), false),
            AccountMeta::new(ctx.accounts.investor_token_account.key(), false),
            AccountMeta::new_readonly(ctx.accounts.structured_product.key(), true),
            AccountMeta::new_readonly(ctx.accounts.extra_account_meta_list.key(), false),
            AccountMeta::new_readonly(ctx.accounts.snapshot_config.key(), false),
            AccountMeta::new(
                ctx.accounts.program_token_snapshot_balances_account.key(),
                false,
            ),
            AccountMeta::new(
                ctx.accounts.investor_token_snapshot_balances_account.key(),
                false,
            ),
            AccountMeta::new_readonly(ctx.accounts.snapshot_transfer_hook_program.key(), false),
        ];
        let cpi_account_infos = vec![
            ctx.accounts.program_token_account.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.investor_token_account.to_account_info(),
            ctx.accounts.structured_product.to_account_info(),
            ctx.accounts.extra_account_meta_list.clone(),
            ctx.accounts.snapshot_config.clone(),
            ctx.accounts.program_token_snapshot_balances_account.clone(),
            ctx.accounts
                .investor_token_snapshot_balances_account
                .clone(),
            ctx.accounts
                .snapshot_transfer_hook_program
                .to_account_info(),
        ];

        let transfer_checked_ix = Instruction {
            program_id: token_program.key(),
            accounts,
            data,
        };

        //
        // msg!("Adding extra account meta list");
        // ExtraAccountMetaList::add_to_cpi_instruction::<ExecuteInstruction>(
        //     &mut transfer_checked_ix,
        //     &mut cpi_account_infos,
        //     &**ctx.accounts.extra_account_meta_list.data.borrow_mut(),
        //     remaining_account_infos.as_slice(),
        // )?;

        msg!("Invoke transfer_checked ix!");
        solana_program::program::invoke_signed(
            &transfer_checked_ix,
            &cpi_account_infos,
            &[&signer_seeds[..]],
        )?;

        let structured_product = &mut ctx.accounts.structured_product;
        structured_product.issuance_date = Some(Clock::get()?.unix_timestamp);

        msg!("ISSUED!");

        Ok(())
    }

    pub fn withdraw_issuance_proceeds(ctx: Context<WithdrawIssuanceProceeds>) -> Result<()> {
        require!(
            ctx.accounts.structured_product.issuance_date.is_some(),
            StructuredProductError::Unauthorized
        );
        require!(
            ctx.accounts.structured_product.issuer == ctx.accounts.issuer.key(),
            StructuredProductError::Unauthorized
        );
        require!(
            ctx.accounts.structured_product_token_account.amount
                == ctx.accounts.mint.supply
                    * ctx
                        .accounts
                        .structured_product
                        .issuance_payment_amount_per_unit,
            StructuredProductError::Unauthorized
        );
        let cpi_program = ctx.accounts.token_program.to_account_info();

        let cpi_accounts = token_2022::TransferChecked {
            from: ctx
                .accounts
                .structured_product_token_account
                .to_account_info(),
            to: ctx.accounts.beneficiary_token_account.to_account_info(),
            mint: ctx.accounts.payment_mint.to_account_info(),
            authority: ctx.accounts.structured_product.to_account_info(),
        };

        let mint_key = ctx.accounts.mint.key();

        let seeds = &[mint_key.as_ref(), &[ctx.accounts.structured_product.bump]];

        token_2022::transfer_checked(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, &[&seeds[..]]),
            ctx.accounts.structured_product_token_account.amount,
            ctx.accounts.payment_mint.decimals,
        )?;

        Ok(())
    }

    pub fn set_payment_price(
        ctx: Context<SetPaymentPrice>,
        _payment_date_offset: i64,
        price_per_unit: u64,
    ) -> Result<()> {
        require!(
            Some(ctx.accounts.authority.key()) == ctx.accounts.payment.price_authority,
            StructuredProductError::Unauthorized
        );

        let current_time = Clock::get()?.unix_timestamp;
        msg!(
            "Payment date: {}, current time: {} price: {}",
            _payment_date_offset,
            current_time,
            price_per_unit
        );

        require!(
            _payment_date_offset <= current_time,
            StructuredProductError::DateNotInPast
        );

        require!(
            ctx.accounts.payment.price_per_unit.is_none(),
            StructuredProductError::PaymentAmountAlreadySet
        );

        let payment = &mut ctx.accounts.payment;
        payment.price_per_unit = Some(price_per_unit);
        Ok(())
    }

    pub fn pull_payment(ctx: Context<PullPayment>, _payment_date_offset: i64) -> Result<()> {
        let payment = &mut ctx.accounts.payment;
        // Validate maturity date

        require!(
            payment.price_per_unit.is_some(),
            StructuredProductError::PaymentAmountNotSet
        );

        require!(!payment.paid, StructuredProductError::Unpaid);

        require!(
            ctx.accounts.structured_product.issuer_treasury_wallet
                == ctx.accounts.treasury_wallet.key(),
            StructuredProductError::Unauthorized
        );

        let cpi_program = ctx.accounts.treasury_wallet_program.to_account_info();

        let mint_key = ctx.accounts.mint.key();
        let seeds = &[mint_key.as_ref(), &[ctx.accounts.structured_product.bump]];

        let cpi_accounts = Withdraw {
            mint: ctx.accounts.payment_mint.to_account_info(),
            treasury_wallet: ctx.accounts.treasury_wallet.to_account_info(),
            treasury_authority: ctx.accounts.treasury_authority.to_account_info(),
            treasury_wallet_token_account: ctx
                .accounts
                .treasury_wallet_token_account
                .to_account_info(),
            destination: ctx.accounts.payment_token_account.to_account_info(),
            withdraw_authorization: ctx.accounts.withdrawal_authorization.to_account_info(),
            authority: ctx.accounts.structured_product.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        msg!("calling withdraw");

        treasury_wallet::cpi::withdraw(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, &[&seeds[..]]),
            ctx.accounts.mint.supply * payment.price_per_unit.unwrap(),
        )?;
        Ok(())
    }

    pub fn settle_payment(ctx: Context<SettlePayment>, payment_date_offset: i64) -> Result<()> {
        require!(
            ctx.accounts.payment.price_per_unit.is_some(),
            StructuredProductError::PaymentAmountNotSet
        );
        require!(
            !ctx.accounts.payment.paid,
            StructuredProductError::AlreadyPaid
        );

        let snapshot_config = &ctx.accounts.snapshot_config;

        // find index of snapshot with payment_date_offset
        let snapshot_index = snapshot_config
            .snapshots
            .iter()
            .position(|&x| x == payment_date_offset);

        // this should never happen...
        require!(
            snapshot_index.is_some(),
            StructuredProductError::InvalidPaymentDate
        );

        let snapshot_balance = ctx
            .accounts
            .beneficiary_snapshot_balances_account
            .balance_at_snapshot(snapshot_index.unwrap());

        require!(
            snapshot_balance > 0,
            StructuredProductError::InsufficientBalance
        );

        let cpi_program = ctx.accounts.token_program.to_account_info();

        let cpi_accounts = token_2022::TransferChecked {
            from: ctx.accounts.payment_token_account.to_account_info(),
            to: ctx
                .accounts
                .beneficiary_payment_token_account
                .to_account_info(),
            mint: ctx.accounts.payment_mint.to_account_info(),
            authority: ctx.accounts.payment.to_account_info(),
        };

        let structured_product_key = ctx.accounts.structured_product.key();

        let seeds = &[
            structured_product_key.as_ref(),
            &[ctx.accounts.payment.principal.into()],
            &payment_date_offset.to_le_bytes(),
            &[ctx.accounts.payment.bump],
        ];

        token_2022::transfer_checked(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, &[&seeds[..]]),
            snapshot_balance * ctx.accounts.payment.price_per_unit.unwrap(),
            ctx.accounts.payment_mint.decimals,
        )?;

        let payment_paid = &mut ctx.accounts.payment_paid;
        payment_paid.paid = true;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut)]
    pub issuer: Signer<'info>,
    /// CHECK: we manually initialize the mint here
    #[account(mut)]
    pub mint: Signer<'info>,
    // TODO: space calculation
    #[account(init, seeds=[mint.key().as_ref()], bump, payer=authority, space=200)]
    pub structured_product: Account<'info, StructuredProductConfig>,
    pub payment_mint: InterfaceAccount<'info, Mint>,
    /// CHECK: validated in initialize_extra_account_meta_list
    pub snapshot_config: AccountInfo<'info>,
    pub issuer_treasury_wallet: Account<'info, TreasuryWalletAccount>,
    pub treasury_wallet_program: Program<'info, TreasuryWallet>,
    /// CHECK: validated in initialize_extra_account_meta_list
    #[account(mut)]
    pub extra_account: AccountInfo<'info>,
    pub snapshot_transfer_hook_program: Program<'info, TransferSnapshotHook>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(principal: bool, payment_date_offset: i64)]
pub struct AddStaticPayment<'info> {
    #[account(mut)]
    authority: Signer<'info>,
    mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds=[mint.key().as_ref()], bump=structured_product.bump)]
    structured_product: Account<'info, StructuredProductConfig>,
    #[account(mut)]
    snapshot_config: Account<'info, SnapshotConfig>,
    // TODO: space calculation
    #[account(init,
    seeds=[structured_product.key().as_ref(), &[principal.into()], &payment_date_offset.to_le_bytes()],
    bump,
    payer=authority,
    space=200)]
    payment: Account<'info, Payment>,
    payment_mint: InterfaceAccount<'info, Mint>,
    snapshot_transfer_hook_program: Program<'info, TransferSnapshotHook>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(principal: bool, payment_date_offset: i64)]
pub struct AddVariablePayment<'info> {
    #[account(mut)]
    authority: Signer<'info>,
    mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds=[mint.key().as_ref()], bump=structured_product.bump)]
    structured_product: Account<'info, StructuredProductConfig>,
    #[account(mut)]
    snapshot_config: Account<'info, SnapshotConfig>,
    // TODO: space calculation
    #[account(
    init,
    seeds=[structured_product.key().as_ref(), &[principal.into()], &payment_date_offset.to_le_bytes()],
    bump,
    payer=authority,
    space=200)]
    payment: Account<'info, Payment>,
    payment_mint: InterfaceAccount<'info, Mint>,
    /// TODO: this should be signed by price authority but omitted for time reasons
    /// CHECK: no checks just authority allowed to call set_payment_amount
    price_authority: AccountInfo<'info>,
    snapshot_transfer_hook_program: Program<'info, TransferSnapshotHook>,
    system_program: Program<'info, System>,
}

// TODO: handle withdrawal when never issued
#[derive(Accounts)]
pub struct PayIssuance<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds=[mint.key().as_ref()], bump=structured_product.bump)]
    pub structured_product: Account<'info, StructuredProductConfig>,
    #[account(mut, token::mint=structured_product.issuance_payment_mint, token::authority=payer)]
    pub payer_token_account: InterfaceAccount<'info, TokenAccount>,
    pub payment_mint: InterfaceAccount<'info, Mint>,
    #[account(init,
    associated_token::mint=payment_mint, associated_token::authority=structured_product,
    payer=payer)]
    pub structured_product_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateMetadata<'info> {
    pub authority: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: account checked by metadata program
    #[account(mut, seeds=[b"metadata", metadata_program.key().as_ref(), mint.key().as_ref()], bump, seeds::program=metadata_program)]
    pub metadata: AccountInfo<'info>,
    #[account(seeds=[mint.key().as_ref()], bump=structured_product.bump)]
    pub structured_product: Account<'info, StructuredProductConfig>,
    pub metadata_program: Program<'info, Metadata>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub sys_var: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Issue<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut)]
    pub issuer: Signer<'info>,
    #[account(mut, mint::authority=structured_product, mint::decimals=0)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds=[mint.key().as_ref()], bump=structured_product.bump)]
    pub structured_product: Account<'info, StructuredProductConfig>,
    /// CHECK: account checked by snapshot hook program
    #[account(mut)]
    pub snapshot_config: AccountInfo<'info>,
    /// CHECK: account checked token program?
    pub extra_account_meta_list: AccountInfo<'info>,
    #[account(init, associated_token::authority=structured_product, associated_token::mint=mint, payer=issuer)]
    pub program_token_account: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: account initialized by snapshot hook program
    #[account(mut)]
    pub program_token_snapshot_balances_account: AccountInfo<'info>,
    #[account(init, associated_token::authority=investor, associated_token::mint=mint, payer=investor)]
    pub investor_token_account: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: account initialized by snapshot hook program
    #[account(mut)]
    pub investor_token_snapshot_balances_account: AccountInfo<'info>,
    pub snapshot_transfer_hook_program: Program<'info, TransferSnapshotHook>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawIssuanceProceeds<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub issuer: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds=[mint.key().as_ref()], bump=structured_product.bump)]
    pub structured_product: Account<'info, StructuredProductConfig>,
    #[account(mut, token::mint=payment_mint)]
    pub beneficiary_token_account: InterfaceAccount<'info, TokenAccount>,
    pub payment_mint: InterfaceAccount<'info, Mint>,
    #[account(mut, token::mint=payment_mint, token::authority=structured_product)]
    pub structured_product_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
#[instruction(_payment_date_offset: i64)]
pub struct SetPaymentPrice<'info> {
    #[account(mut)]
    authority: Signer<'info>,
    #[account(mut)]
    structured_product: Account<'info, StructuredProductConfig>,
    #[account(mut, seeds=[structured_product.key().as_ref(), &[payment.principal.into()], &_payment_date_offset.to_le_bytes()], bump=payment.bump)]
    payment: Account<'info, Payment>,
}

#[derive(Accounts)]
#[instruction(_payment_date_offset: i64)]
pub struct PullPayment<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    /// CHECK: account checked by treasury wallet program
    withdrawal_authorization: AccountInfo<'info>,
    #[account()]
    treasury_wallet: Account<'info, TreasuryWalletAccount>,
    ///CHECK: account will be checked by treasury wallet program
    treasury_authority: AccountInfo<'info>,
    #[account(mut, token::authority=treasury_authority)]
    treasury_wallet_token_account: InterfaceAccount<'info, TokenAccount>,
    mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds=[mint.key().as_ref()], bump=structured_product.bump)]
    structured_product: Account<'info, StructuredProductConfig>,
    payment_mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds=[structured_product.key().as_ref(), &[payment.principal.into()], &_payment_date_offset.to_le_bytes()], bump=payment.bump)]
    payment: Account<'info, Payment>,
    #[account(init, associated_token::authority=payment, associated_token::mint=payment_mint, payer=payer)]
    payment_token_account: InterfaceAccount<'info, TokenAccount>,
    treasury_wallet_program: Program<'info, TreasuryWallet>,
    token_program: Program<'info, Token2022>,
    associated_token_program: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(payment_date_offset: i64)]
pub struct SettlePayment<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds=[mint.key().as_ref()], bump=structured_product.bump)]
    structured_product: Account<'info, StructuredProductConfig>,
    #[account(seeds=[b"snapshots", mint.key().as_ref()], seeds::program=snapshot_transfer_hook_program, bump)]
    snapshot_config: Account<'info, SnapshotConfig>,
    payment_mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds=[structured_product.key().as_ref(), &[payment.principal.into()], &payment_date_offset.to_le_bytes()], bump=payment.bump)]
    payment: Account<'info, Payment>,
    #[account(mut, token::mint=payment_mint, token::authority=payment)]
    payment_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(init, seeds=[payment.key().as_ref(), beneficiary_token_account.key().as_ref()], bump, space=9, payer=payer)]
    payment_paid: Account<'info, PaymentPaid>,
    /// CHECK: will only get paid if has an unpaid snapshot balance
    beneficiary: AccountInfo<'info>,
    #[account(mut, token::mint=mint, token::authority=beneficiary)]
    beneficiary_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(seeds=[mint.key().as_ref(), beneficiary_token_account.key().as_ref()], seeds::program=snapshot_transfer_hook_program, bump)]
    beneficiary_snapshot_balances_account: Account<'info, SnapshotTokenAccountBalances>,
    #[account(mut, token::mint=payment_mint, token::authority=beneficiary)]
    beneficiary_payment_token_account: InterfaceAccount<'info, TokenAccount>,
    snapshot_transfer_hook_program: Program<'info, TransferSnapshotHook>,
    token_program: Program<'info, Token2022>,
    system_program: Program<'info, System>,
}

#[account]
pub struct StructuredProductConfig {
    authority: Pubkey,
    investor: Pubkey,
    issuer: Pubkey,
    supply: u64,
    issuer_treasury_wallet: Pubkey,
    issuance_payment_mint: Pubkey,
    issuance_payment_amount_per_unit: u64,
    paid: bool,
    num_payments: u8,
    principal_defined: bool,
    issuance_date: Option<i64>,
    bump: u8,
}

#[account]
pub struct Payment {
    pub payment_mint: Pubkey,
    pub price_authority: Option<Pubkey>,
    pub price_per_unit: Option<u64>,
    pub principal: bool,
    pub paid: bool,
    pub bump: u8,
}

#[account]
pub struct PaymentPaid {
    paid: bool,
}
