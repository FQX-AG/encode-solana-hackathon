use anchor_lang::prelude::*;
use dummy_oracle::program::DummyOracle;
use dummy_oracle::DummyOracleAccount;
use structured_product::program::StructuredProduct;
use structured_product::{Payment, StructuredProductConfig};

declare_id!("DqW32SwCjeSRiWn3TvASej9Y5MTwcFHKkrrk1pmxpKPR");

pub fn calc_final_principal(
    initial_principal: u64,
    initial_fixing_price: u64,
    barrier: u64,
    final_underlying_fixing_price: u64,
) -> u64 {
    match final_underlying_fixing_price {
        final_fixing_price if final_fixing_price <= barrier => {
            ((initial_principal as u128 * final_fixing_price as u128)
                / initial_fixing_price as u128) as u64
        }
        _ => initial_principal,
    }
}

#[error_code]
pub enum BRCPriceAuthorityError {
    #[msg("Unauthorized")]
    Unauthorized,
}

#[program]
pub mod brc_price_authority {
    use super::*;
    use structured_product::cpi::accounts::SetPaymentPrice;
    use structured_product::cpi::set_payment_price;

    pub fn initialize(
        ctx: Context<Initialize>,
        underlying_symbol: String,
        _payment_date_offset: i64,
        initial_principal: u64,
        initial_fixing_price: u64,
        barrier_in_basis_points: u64,
    ) -> Result<()> {
        msg!("Initializing BRC at {}", ctx.accounts.brc.key().clone());
        let brc = &mut ctx.accounts.brc;

        brc.authority = *ctx.accounts.authority.key;
        brc.underlying_symbol = underlying_symbol;
        brc.initial_principal = initial_principal;
        brc.initial_fixing_price = initial_fixing_price;
        // initial fixing prices scaled by the barrier_in_basis_points
        brc.barrier = initial_fixing_price * barrier_in_basis_points / 10000;
        brc.target_payment = ctx.accounts.payment.key();
        brc.dummy_oracle = ctx.accounts.dummy_oracle.key();
        // to be set by the final fixing price
        brc.final_principal = None;
        brc.final_underlying_fixing_price = None;
        brc.final_fixing_date = None;

        brc.bump = ctx.bumps.brc;
        msg!("Brc: {:?}", brc);

        Ok(())
    }

    pub fn set_final_fixing_price(
        ctx: Context<SetFinalFixingPrice>,
        _underlying_symbol: String,
        payment_date_offset: i64,
    ) -> Result<()> {
        require!(
            ctx.accounts.payment.key() == ctx.accounts.brc.target_payment,
            BRCPriceAuthorityError::Unauthorized
        );
        let brc = &ctx.accounts.brc;

        let initial_principal = brc.initial_principal;
        let initial_fixing_price = brc.initial_fixing_price;
        let barrier = brc.barrier;
        let final_underlying_fixing_price = ctx.accounts.dummy_oracle.current_price;

        let final_principal = calc_final_principal(
            initial_principal,
            initial_fixing_price,
            barrier,
            final_underlying_fixing_price,
        );

        msg!("Finalizing brc at {}", ctx.accounts.brc.key());
        msg!("Initial principal: {}, initial_fixing_price: {}, barrier: {}, final_fixing_price: {}, Final principal: {}", 
            initial_principal, initial_fixing_price, barrier, final_underlying_fixing_price, final_principal);

        let cpi_program = ctx.accounts.structured_product_program.to_account_info();

        let cpi_accounts = SetPaymentPrice {
            authority: ctx.accounts.brc.to_account_info(),
            payment: ctx.accounts.payment.to_account_info(),
            structured_product: ctx.accounts.structured_product.to_account_info(),
        };

        let structured_product_key = ctx.accounts.structured_product.key();

        let seeds = &[structured_product_key.as_ref(), &[ctx.accounts.brc.bump]];

        set_payment_price(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, &[&seeds[..]]),
            payment_date_offset,
            final_principal,
        )?;

        let brc = &mut ctx.accounts.brc;

        brc.final_underlying_fixing_price = Some(final_underlying_fixing_price);
        brc.final_principal = Some(final_principal);
        brc.final_fixing_date = Some(Clock::get()?.unix_timestamp);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(underlying_symbol: String, payment_date_offset: i64, initial_principal: u64, barrier_in_basis_points: u64)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account()]
    pub structured_product: Account<'info, StructuredProductConfig>,
    /// CHECK:
    #[account(seeds=[structured_product.key().as_ref(), &[true.into()], &payment_date_offset.to_le_bytes()],
    bump,
    seeds::program=structured_product_program)]
    pub payment: AccountInfo<'info>,
    // TODO: space calc
    #[account(init, seeds=[structured_product.key().as_ref()], bump, payer=authority, space=500)]
    pub brc: Account<'info, BRCInfo>,
    #[account(seeds=[authority.key().as_ref(), underlying_symbol.as_bytes()], bump=dummy_oracle.bump, seeds::program=dummy_oracle_program)]
    pub dummy_oracle: Account<'info, DummyOracleAccount>,
    pub dummy_oracle_program: Program<'info, DummyOracle>,
    pub structured_product_program: Program<'info, StructuredProduct>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetFinalFixingPrice<'info> {
    pub payer: Signer<'info>,
    #[account(mut, seeds=[structured_product.key().as_ref()], bump=brc.bump)]
    pub brc: Account<'info, BRCInfo>,
    pub structured_product: Account<'info, StructuredProductConfig>,
    pub payment: Account<'info, Payment>,
    pub dummy_oracle: Account<'info, DummyOracleAccount>,
    pub dummy_oracle_program: Program<'info, DummyOracle>,
    pub structured_product_program: Program<'info, StructuredProduct>,
}

#[account]
#[derive(Debug)]
pub struct BRCInfo {
    pub authority: Pubkey,
    pub underlying_symbol: String,
    pub initial_principal: u64,
    pub initial_fixing_price: u64,
    pub barrier: u64,
    pub dummy_oracle: Pubkey,
    pub final_underlying_fixing_price: Option<u64>,
    pub final_fixing_date: Option<i64>,
    pub final_principal: Option<u64>,
    pub target_payment: Pubkey,
    pub bump: u8,
}

#[cfg(test)]
mod tests {
    use super::*;

    macro_rules! calc_final_principal_tests {
        ($($name:ident: $expected:expr,)*) => {
            $(
                #[test]
                fn $name() {
                    let (initial_principal, initial_fixing_price, barrier, final_underlying_fixing_price, expected) = $expected;
                    let result = calc_final_principal(
                        initial_principal,
                        initial_fixing_price,
                        barrier,
                        final_underlying_fixing_price,
                    );
                    assert_eq!(result, expected);
                }
            )*
        }
    }

    #[cfg(test)]
    calc_final_principal_tests! {
        final_principal_price_test_1: (100000, 42000, 42000, 55000, 100000,),
        final_principal_price_test_2: (100000, 42000, 42000, 50400, 100000,),
        final_principal_price_test_3: (100000, 42000, 42000, 42000, 100000,),
        final_principal_price_test_4: (100000000000, 42000000000, 42000000000, 30000000000, 71428571428,),
        final_principal_price_test_5: (100000, 42000, 42000, 0, 0,),
        final_principal_price_test_6: (100000, 42000, 33600, 55000, 100000,),
        final_principal_price_test_7: (100000, 42000, 33600, 50400, 100000,),
        final_principal_price_test_8: (100000, 42000, 33600, 33600, 80000,),
        final_principal_price_test_9: (100000000000, 42000000000, 33600000000, 30000000000, 71428571428,),
        final_principal_price_test_10: (100000, 42000, 33600, 0, 0,),
        final_principal_price_test_11: (100000, 42000, 0, 55000, 100000,),
        final_principal_price_test_12: (100000, 42000, 0, 50400, 100000,),
        final_principal_price_test_13: (100000, 42000, 0, 45000, 100000,),
        final_principal_price_test_14: (100000, 42000, 0, 30000, 100000,),
        final_principal_price_test_15: (100000, 42000, 0, 0, 0,),

    }
}
