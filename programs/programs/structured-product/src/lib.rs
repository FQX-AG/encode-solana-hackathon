use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::spl_token_2022::extension;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};
use transfer_snapshot_hook::program::TransferSnapshotHook;
use treasury_wallet::program::TreasuryWallet;
use treasury_wallet::TreasuryWalletAccount;

declare_id!("GYFmKqbpYHUrML3BstU9VUnVdEE6ho9tzVJzs1DAR5iz");

#[program]
pub mod structured_product {
    use super::*;
    use anchor_spl::token;
    use anchor_spl::token_2022;
    use solana_program::program::invoke_signed;

    pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        let structured_product = &mut ctx.accounts.structured_product;
        structured_product.investor = ctx.accounts.investor.key();
        structured_product.issuer = ctx.accounts.issuer.key();
        structured_product.issuer_treasury_wallet = ctx.accounts.issuer_treasury_wallet.key();

        let cpi_program = ctx.accounts.token_program.to_account_info();

        let mint_key = ctx.accounts.mint.key();
        let signer_seeds = &[mint_key.as_ref(), &[ctx.bumps.structured_product]];

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
            amount,
        )?;

        let cpi_accounts = token_2022::TransferChecked {
            from: ctx.accounts.program_token_account.to_account_info(),
            to: ctx.accounts.investor_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            authority: ctx.accounts.structured_product.to_account_info(),
        };

        token_2022::transfer_checked(
            CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, &[&signer_seeds[..]]),
            amount,
            0,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    /// CHECK: just to be set as issuer should verify their signature later
    pub issuer: AccountInfo<'info>,
    // TODO: space calculation
    #[account(init, seeds=[mint.key().as_ref()], bump, payer=investor, space=200)]
    pub structured_product: Account<'info, StructuredProduct>,
    #[account(mut, mint::authority=structured_product)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)] //TODO: validate that the program is the owner
    pub program_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)] // TODO: validate that the investor is the owner
    pub investor_token_account: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: Add account validation back
    pub issuer_treasury_wallet: AccountInfo<'info>,
    // pub treasury_wallet_program: Program<'info, TreasuryWallet>,
    // pub snapshot_transfer_hook_program: Program<'info, TransferSnapshotHook>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct StructuredProduct {
    investor: Pubkey,
    issuer: Pubkey,
    issuer_treasury_wallet: Pubkey,
}
