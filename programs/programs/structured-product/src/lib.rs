use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};

use treasury_wallet::program::TreasuryWallet;
use treasury_wallet::{TreasuryWalletAccount, WithdrawAuthorization};

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
    #[msg("Already issued")]
    AlreadyIssued,
    #[msg("Date not in past")]
    DateNotInPast,
}

#[program]
pub mod structured_product {
    use anchor_spl::token_2022;

    use treasury_wallet::cpi::accounts::Withdraw;

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let structured_product = &mut ctx.accounts.structured_product;
        structured_product.authority = ctx.accounts.authority.key();
        structured_product.investor = ctx.accounts.investor.key();
        structured_product.issuer = ctx.accounts.issuer.key();
        structured_product.issuer_treasury_wallet = ctx.accounts.issuer_treasury_wallet.key();
        structured_product.issued = false;

        // Initialize snapshot transfer-hook here
        // let transfer_hook_instruction = extension::transfer_hook::instruction::initialize(
        //     &ctx.accounts.token_program.key(),
        //     &ctx.accounts.mint.key(),
        //     Some(ctx.accounts.structured_product_signing_authority.key()),
        //     Some(ctx.accounts.snapshot_transfer_hook.key()),
        // )?;
        //
        // invoke_signed(
        //     &transfer_hook_instruction,
        //     &[
        //         ctx.accounts.token_program.to_account_info(),
        //         ctx.accounts.mint.to_account_info(),
        //         ctx.accounts
        //             .structured_product_signing_authority
        //             .to_account_info(),
        //     ],
        //     &[&signer_seeds[..]],
        // )?;

        Ok(())
    }

    pub fn add_variable_payment(
        ctx: Context<AddVariablePayment>,
        _payment_date: i64,
    ) -> Result<()> {
        // TODO add validation and index handling for multiple payments.
        // TODO add snapshots for payments
        require!(
            ctx.accounts.authority.key() == ctx.accounts.structured_product.authority.key(),
            StructuredProductError::Unauthorized
        );
        require!(
            !ctx.accounts.structured_product.issued,
            StructuredProductError::AlreadyIssued
        );

        let payment = &mut ctx.accounts.payment;
        payment.price_authority = Some(ctx.accounts.price_authority.key());
        payment.payment_mint = ctx.accounts.payment_mint.key();
        payment.payment_redemption_mint = ctx.accounts.payment_redemption_mint.key();
        payment.paid = false;
        payment.bump = ctx.bumps.payment;

        Ok(())
    }

    pub fn issue(ctx: Context<Issue>, supply: u64) -> Result<()> {
        require!(
            ctx.accounts.issuer.key() == ctx.accounts.structured_product.issuer.key(),
            StructuredProductError::Unauthorized
        );
        require!(
            !ctx.accounts.structured_product.issued,
            StructuredProductError::Unauthorized
        );

        let mint_key = ctx.accounts.mint.key();
        let signer_seeds = &[mint_key.as_ref(), &[ctx.bumps.structured_product]];

        let cpi_program = ctx.accounts.token_program.to_account_info();

        let cpi_accounts = token_2022::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.program_token_account.to_account_info(),
            authority: ctx.accounts.structured_product.to_account_info(),
        };

        token_2022::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                &[&signer_seeds[..]],
            ),
            supply,
        )?;

        msg!("Minted tokens");

        let cpi_accounts = token_2022::TransferChecked {
            from: ctx.accounts.program_token_account.to_account_info(),
            to: ctx.accounts.investor_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            authority: ctx.accounts.structured_product.to_account_info(),
        };

        token_2022::transfer_checked(
            CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, &[&signer_seeds[..]]),
            supply,
            0,
        )?;

        let structured_product = &mut ctx.accounts.structured_product;
        structured_product.issued = true;

        msg!("ISSUED!");

        Ok(())
    }

    pub fn set_payment_price(
        ctx: Context<SetPaymentPrice>,
        _payment_date: i64,
        price_per_unit: u64,
    ) -> Result<()> {
        require!(
            Some(ctx.accounts.authority.key()) == ctx.accounts.payment.price_authority,
            StructuredProductError::Unauthorized
        );

        let current_time = Clock::get()?.unix_timestamp;
        msg!(
            "Payment date: {}, current time: {}",
            _payment_date,
            current_time
        );

        require!(
            _payment_date <= current_time,
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

    pub fn pull_payment(ctx: Context<PullPayment>, _payment_date: i64) -> Result<()> {
        let payment = &mut ctx.accounts.payment;
        // Validate maturity date

        require!(
            payment.price_per_unit.is_some(),
            StructuredProductError::PaymentAmountNotSet
        );

        require!(!payment.paid, StructuredProductError::AlreadyPaid);

        require!(
            ctx.accounts.structured_product.issuer_treasury_wallet
                == ctx.accounts.treasury_wallet.key(),
            StructuredProductError::Unauthorized
        );

        let cpi_program = ctx.accounts.treasury_wallet_program.to_account_info();

        let mint_key = ctx.accounts.mint.key();
        let seeds = &[mint_key.as_ref(), &[ctx.bumps.structured_product]];

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
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut)]
    pub issuer: Signer<'info>,
    #[account(init, mint::authority=structured_product, mint::decimals=0, payer=authority)]
    pub mint: InterfaceAccount<'info, Mint>,
    // TODO: space calculation
    #[account(init, seeds=[mint.key().as_ref()], bump, payer=authority, space=200)]
    pub structured_product: Account<'info, StructuredProduct>,
    /// CHECK: Add account validation back
    pub issuer_treasury_wallet: Account<'info, TreasuryWalletAccount>,
    pub treasury_wallet_program: Program<'info, TreasuryWallet>,
    // pub snapshot_transfer_hook_program: Program<'info, TransferSnapshotHook>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_payment_date: i64)]
pub struct AddVariablePayment<'info> {
    #[account(mut)]
    authority: Signer<'info>,
    #[account(mut)]
    structured_product: Account<'info, StructuredProduct>,
    // TODO: space calculation
    #[account(init, seeds=[structured_product.key().as_ref(), &_payment_date.to_le_bytes()], bump, payer=authority, space=200)]
    payment: Account<'info, Payment>,
    payment_mint: InterfaceAccount<'info, Mint>,
    payment_redemption_mint: InterfaceAccount<'info, Mint>,
    /// CHECK: no checks just authority allowed to call set_payment_amount
    price_authority: AccountInfo<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Issue<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut)]
    pub issuer: Signer<'info>,
    #[account(mut, mint::authority=structured_product, mint::decimals=0)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds=[mint.key().as_ref()], bump)]
    pub structured_product: Account<'info, StructuredProduct>,
    #[account(init, associated_token::authority=structured_product, associated_token::mint=mint, payer=issuer)]
    pub program_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(init, associated_token::authority=investor, associated_token::mint=mint, payer=investor)]
    pub investor_token_account: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_payment_date: i64)]
pub struct SetPaymentPrice<'info> {
    #[account(mut)]
    authority: Signer<'info>,
    #[account(mut)]
    structured_product: Account<'info, StructuredProduct>,
    #[account(mut, seeds=[structured_product.key().as_ref(), &_payment_date.to_le_bytes()], bump=payment.bump)]
    payment: Account<'info, Payment>,
}

#[derive(Accounts)]
#[instruction(_payment_date: i64)]
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
    #[account(mut, seeds=[mint.key().as_ref()], bump)]
    structured_product: Account<'info, StructuredProduct>,
    payment_mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds=[structured_product.key().as_ref(), &_payment_date.to_le_bytes()], bump=payment.bump)]
    payment: Account<'info, Payment>,
    #[account(init, associated_token::authority=payment, associated_token::mint=payment_mint, payer=payer)]
    payment_token_account: InterfaceAccount<'info, TokenAccount>,
    treasury_wallet_program: Program<'info, TreasuryWallet>,
    token_program: Program<'info, Token2022>,
    associated_token_program: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,
}

#[account]
pub struct StructuredProduct {
    authority: Pubkey,
    investor: Pubkey,
    issuer: Pubkey,
    issuer_treasury_wallet: Pubkey,
    issued: bool,
}

#[account]
pub struct Payment {
    payment_redemption_mint: Pubkey,
    payment_mint: Pubkey,
    price_authority: Option<Pubkey>,
    price_per_unit: Option<u64>,
    paid: bool,
    bump: u8,
}
