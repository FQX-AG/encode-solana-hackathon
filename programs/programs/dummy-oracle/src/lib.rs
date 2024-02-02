use anchor_lang::prelude::*;

declare_id!("BZuknSg2JQVQFt4d6a5eHsoeivEMVp4tvSnkas8yoxgY");

#[program]
pub mod dummy_oracle {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        asset_symbol: String,
        initial_price: u64,
        decimals: u8,
    ) -> Result<()> {
        let dummy_oracle = &mut ctx.accounts.dummy_oracle;
        dummy_oracle.authority = *ctx.accounts.authority.key;
        dummy_oracle.asset_symbol = asset_symbol;
        dummy_oracle.current_price = initial_price;
        dummy_oracle.decimals = decimals;
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
    #[account(init,
    seeds=[authority.key().as_ref(), asset_symbol.as_bytes()], bump,
    payer=authority, space=DummyOracle::space(asset_symbol.len()) )]
    pub dummy_oracle: Account<'info, DummyOracle>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(asset_symbol: String)]
pub struct UpdatePrice<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds=[authority.key().as_ref(), asset_symbol.as_bytes()], bump=dummy_oracle.bump)]
    pub dummy_oracle: Account<'info, DummyOracle>,
}

#[account]
pub struct DummyOracle {
    pub authority: Pubkey,
    pub asset_symbol: String,
    pub current_price: u64,
    pub decimals: u8,
    pub last_update: i64,
    pub bump: u8,
}

impl DummyOracle {
    pub fn space(asset_symbol_len_in_bytes: usize) -> usize {
        8 + 4 + asset_symbol_len_in_bytes + 32 + 8 + 1 + 8 + 1
    }
}
