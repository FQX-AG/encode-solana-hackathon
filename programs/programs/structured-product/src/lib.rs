use anchor_lang::prelude::*;
use anchor_spl::token_2022::spl_token_2022::extension;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::Mint;
use transfer_snapshot_hook::program::TransferSnapshotHook;
use treasury_wallet::TreasuryWallet;

declare_id!("GYFmKqbpYHUrML3BstU9VUnVdEE6ho9tzVJzs1DAR5iz");

#[program]
pub mod structured_product {
    use super::*;
    use anchor_spl::token;
    use solana_program::program::invoke_signed;

    pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        let structured_product = &mut ctx.accounts.structured_product;
        structured_product.investor = ctx.accounts.investor.key();
        structured_product.issuer = ctx.accounts.issuer.key();
        structured_product.issuer_treasury_wallet = ctx.accounts.issuer_treasury_wallet.key();

        let cpi_accounts = token::InitializeMint2 {
            mint: ctx.accounts.mint.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let structured_product_key = ctx.accounts.structured_product.key();
        let signer_seeds = &[
            structured_product_key.as_ref(),
            &[ctx.bumps.structured_product_signing_authority],
        ];

        let mint_authority = ctx.accounts.structured_product_signing_authority.key();
        token::initialize_mint2(
            CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, &[&signer_seeds[..]]),
            0,
            &mint_authority,
            None,
        )?;

        // Initialize snapshot transfer-hook here
        let transfer_hook_instruction = extension::transfer_hook::instruction::initialize(
            &ctx.accounts.token_program.key(),
            &ctx.accounts.mint.key(),
            Some(ctx.accounts.structured_product_signing_authority.key()),
            Some(ctx.accounts.snapshot_transfer_hook.key()),
        )?;

        invoke_signed(
            &transfer_hook_instruction,
            &[
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                ctx.accounts
                    .structured_product_signing_authority
                    .to_account_info(),
            ],
            &[&signer_seeds[..]],
        )?;

        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.investor.to_account_info(),
            authority: ctx
                .accounts
                .structured_product_signing_authority
                .to_account_info(),
        };

        token::mint_to(
            CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, &[&signer_seeds[..]]),
            amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    /// CHECK: just to be set as issuer
    pub issuer: Signer<'info>,
    #[account(init, seeds=[mint.key().as_ref()], bump, payer=investor, space=1000)]
    // TODO: space calculation
    pub structured_product: Account<'info, StructuredProduct>,
    #[account(init, payer=investor, space=82)]
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: account not to be initialized just to sign txs
    #[account(seeds=[structured_product.key().as_ref()], bump)]
    pub structured_product_signing_authority: AccountInfo<'info>,
    pub snapshot_transfer_hook: Program<'info, TransferSnapshotHook>,
    pub issuer_treasury_wallet: Account<'info, TreasuryWallet>,
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
