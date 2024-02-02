use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

declare_id!("BZuknSg2JQVQFt4d6a5eHsoeivEMVp4tvSnkas8yoxgY");

#[program]
pub mod dummy_oracle {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        asset_symbol: String,
        initial_price: u64,
    ) -> Result<()> {
        let dummy_oracle = &mut ctx.accounts.dummy_oracle;
        dummy_oracle.authority = *ctx.accounts.authority.key;
        dummy_oracle.asset_symbol = asset_symbol;
        dummy_oracle.current_price = initial_price;
        dummy_oracle.quote_currency_mint = ctx.accounts.quote_currency_mint.key();
        dummy_oracle.last_update = Clock::get()?.unix_timestamp;
        dummy_oracle.bump = ctx.bumps.dummy_oracle;

        Ok(())
    }

    pub fn update_price(
        ctx: Context<UpdatePrice>,
        _asset_symbol: String,
        new_price: u64,
    ) -> Result<()> {
        let dummy_oracle = &mut ctx.accounts.dummy_oracle;
        dummy_oracle.current_price = new_price;
        dummy_oracle.last_update = Clock::get()?.unix_timestamp;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(asset_symbol: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub quote_currency_mint: InterfaceAccount<'info, Mint>,
    #[account(init,
    seeds=[authority.key().as_ref(), asset_symbol.as_bytes()], bump,
    payer=authority, space=DummyOracleAccount::space(asset_symbol.len()))]
    pub dummy_oracle: Account<'info, DummyOracleAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(asset_symbol: String)]
pub struct UpdatePrice<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds=[authority.key().as_ref(), asset_symbol.as_bytes()], bump=dummy_oracle.bump)]
    pub dummy_oracle: Account<'info, DummyOracleAccount>,
}

#[account]
pub struct DummyOracleAccount {
    pub authority: Pubkey,
    pub asset_symbol: String,
    pub current_price: u64,
    pub quote_currency_mint: Pubkey,
    pub last_update: i64,
    pub bump: u8,
}

impl DummyOracleAccount {
    pub fn space(asset_symbol_len_in_bytes: usize) -> usize {
        8 + 32 + 4 + asset_symbol_len_in_bytes + 8 + 32 + 8 + 1
    }
}
