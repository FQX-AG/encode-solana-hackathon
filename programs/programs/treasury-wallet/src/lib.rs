use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use anchor_spl::token_interface::TokenAccount;

declare_id!("3DUqJ4S1dUoKzC77NmJXq2wiDqwR3NoNkEwtkFU4SaY3");
#[error_code]
pub enum TreasuryWalletError {
    #[msg("Invalid owner")]
    InvalidOwner,
    #[msg("Unauthorized")]
    Unauthorized,
}

#[program]
pub mod treasury_wallet {
    use super::*;
    use anchor_spl::token;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let treasury_wallet = &mut ctx.accounts.treasury_wallet;
        treasury_wallet.owner = ctx.accounts.owner.key();
        Ok(())
    }

    pub fn add_withdraw_authorization(ctx: Context<AddWithdrawAuthorization>) -> Result<()> {
        require!(
            ctx.accounts.treasury_wallet.owner == ctx.accounts.owner.key(),
            TreasuryWalletError::Unauthorized
        );
        let withdraw_authorization = &mut ctx.accounts.withdraw_authorization;
        withdraw_authorization.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(
            ctx.accounts.withdraw_authorization.authority == ctx.accounts.authority.key(),
            TreasuryWalletError::Unauthorized
        );

        let treasury_wallet_key = ctx.accounts.treasury_wallet.key();

        let authorization_signer_seeds = &[
            treasury_wallet_key.as_ref(),
            &[ctx.bumps.treasury_authority],
        ];

        let cpi_accounts = token::Transfer {
            from: ctx.accounts.treasury_wallet_token_account.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.treasury_authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();

        token::transfer(
            CpiContext::new_with_signer(
                cpi_program,
                cpi_accounts,
                &[&authorization_signer_seeds[..]],
            ),
            amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(init, payer = owner, space =100)] // TODO: calc proper space
    pub treasury_wallet: Account<'info, TreasuryWalletAccount>,
    /// CHECK: account will never be validated, it's just used to sign transactions as the treasury wallet
    #[account(seeds = [treasury_wallet.key().as_ref()], bump)]
    pub treasury_authority: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddWithdrawAuthorization<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK: account can invoke withdrawals
    pub authority: AccountInfo<'info>,
    #[account()]
    pub treasury_wallet: Account<'info, TreasuryWalletAccount>,
    #[account(init,
    seeds = [treasury_wallet.key().as_ref(), authority.key().as_ref()],
    bump, payer = owner, space = 48)]
    pub withdraw_authorization: Account<'info, WithdrawAuthorization>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub treasury_wallet: Account<'info, TreasuryWalletAccount>,
    #[account(mut)] // Validate that the treasury wallet is the owner
    pub treasury_wallet_token_account: InterfaceAccount<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(seeds = [treasury_wallet.key().as_ref(), authority.key().as_ref()], bump)]
    pub withdraw_authorization: Account<'info, WithdrawAuthorization>,
    /// CHECK: account will never be validated, it's just used to sign transactions as the treasury wallet
    #[account(seeds = [treasury_wallet.key().as_ref()], bump)]
    pub treasury_authority: AccountInfo<'info>,
    #[account(mut)]
    pub destination: InterfaceAccount<'info, TokenAccount>,
    #[account()]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct TreasuryWalletAccount {
    pub owner: Pubkey,
}

#[account]
pub struct WithdrawAuthorization {
    pub authority: Pubkey,
}
