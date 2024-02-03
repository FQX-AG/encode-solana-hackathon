use anchor_lang::{
    prelude::*,
    system_program::{create_account, CreateAccount},
};
use anchor_spl::token_interface::{Mint, TokenAccount};

use {
    anchor_spl::token_2022::spl_token_2022::{
        extension::{
            transfer_hook::TransferHookAccount, BaseStateWithExtensions, StateWithExtensions,
        },
        state::Account as Token2022Account,
    },
    spl_transfer_hook_interface::error::TransferHookError,
};

declare_id!("6sGAcb6vw8bhcVNPv5pMEhr3dXyeYoX2X89S3NkEaaJP");

// Sha256(spl-transfer-hook-interface:execute)[..8]
pub const EXECUTE_IX_TAG_LE: [u8; 8] = [105, 37, 101, 197, 75, 251, 102, 26];

#[error_code]
enum SnapshotHookError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("No snapshot found")]
    NoSnapshotFound,
    #[msg("Snapshots are active")]
    Active,
    #[msg("Snapshots are inactive")]
    Inactive,
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
}

fn check_token_account_is_transferring(account_data: &[u8]) -> Result<()> {
    let token_account = StateWithExtensions::<Token2022Account>::unpack(account_data)?;
    let extension = token_account.get_extension::<TransferHookAccount>()?;
    if bool::from(extension.transferring) {
        Ok(())
    } else {
        Err(Into::<ProgramError>::into(
            TransferHookError::ProgramCalledOutsideOfTransfer,
        ))?
    }
}

#[program]
pub mod transfer_snapshot_hook {
    use spl_tlv_account_resolution::account::ExtraAccountMeta;
    use spl_tlv_account_resolution::seeds::Seed;
    use spl_tlv_account_resolution::state::ExtraAccountMetaList;
    use spl_transfer_hook_interface::instruction::ExecuteInstruction;

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, max_snapshots: u8) -> Result<()> {
        let snapshot_config = &mut ctx.accounts.snapshot_config;
        require!(
            snapshot_config.activated_date.is_none(),
            SnapshotHookError::Active
        );

        snapshot_config.authority = ctx.accounts.authority.key();
        snapshot_config.snapshots = vec![0; max_snapshots as usize];
        snapshot_config.defined_snapshots = 0;
        snapshot_config.activated_date = None;
        Ok(())
    }

    // we're only allowing to define snapshots in order for now
    pub fn define_snapshot(ctx: Context<DefineSnapshot>, timestamp_offset: i64) -> Result<()> {
        msg!(
            "Signing authority: {}, snapshot_config.authority: {}",
            ctx.accounts.authority.key(),
            ctx.accounts.snapshot_config.authority,
        );
        require!(
            ctx.accounts.authority.key() == ctx.accounts.snapshot_config.authority,
            SnapshotHookError::Unauthorized
        );

        require!(
            ctx.accounts.snapshot_config.activated_date.is_none(),
            SnapshotHookError::Active
        );
        require!(timestamp_offset > 0, SnapshotHookError::InvalidTimestamp);

        let defined_snapshots = ctx.accounts.snapshot_config.defined_snapshots as usize;

        if defined_snapshots > 0 {
            require!(
                timestamp_offset > ctx.accounts.snapshot_config.snapshots[defined_snapshots - 1],
                SnapshotHookError::InvalidTimestamp
            );
        }
        let snapshot_config = &mut ctx.accounts.snapshot_config;
        snapshot_config.snapshots[defined_snapshots] = timestamp_offset;
        snapshot_config.defined_snapshots += 1;
        Ok(())
    }

    pub fn activate(ctx: Context<ActivateSnapshots>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.snapshot_config.authority,
            SnapshotHookError::Unauthorized
        );
        require!(
            ctx.accounts.snapshot_config.defined_snapshots > 0,
            SnapshotHookError::NoSnapshotFound
        );
        require!(
            ctx.accounts.snapshot_config.activated_date.is_none(),
            SnapshotHookError::Active
        );
        let snapshot_config = &mut ctx.accounts.snapshot_config;
        snapshot_config.activated_date = Some(Clock::get()?.unix_timestamp);
        Ok(())
    }

    pub fn init_snapshot_balances_account(ctx: Context<InitSnapshotBalancesAccount>) -> Result<()> {
        let snapshot_config = &mut ctx.accounts.snapshot_config;
        let num_snapshots = snapshot_config.snapshots.len();
        let snapshot_balances = &mut ctx.accounts.snapshot_balances;
        snapshot_balances.snapshot_balances = vec![None; num_snapshots];
        Ok(())
    }

    pub fn transfer_hook<'a>(
        ctx: Context<'_, '_, 'a, 'a, TransferHook>,
        amount: u64,
    ) -> Result<()> {
        msg!("Transfer hook invoked");
        require!(
            ctx.accounts.snapshot_config.activated_date.is_some(),
            SnapshotHookError::Inactive
        );

        msg!("Transfer amount: {}", amount);
        msg!(
            "Transfer with extra account PDA: {}",
            ctx.accounts.extra_account_meta_list.key()
        );
        msg!(
            "Transfer from {} to {}",
            ctx.accounts.source.key(),
            ctx.accounts.destination.key()
        );

        msg!("Source balance: {}", ctx.accounts.source.amount);
        msg!("Destination balance: {}", ctx.accounts.destination.amount);

        let source_account = &ctx.accounts.source;
        let destination_account = &ctx.accounts.destination;

        check_token_account_is_transferring(&source_account.to_account_info().try_borrow_data()?)?;
        check_token_account_is_transferring(
            &destination_account.to_account_info().try_borrow_data()?,
        )?;

        let timestamp = Clock::get()?.unix_timestamp;

        let current_snapshot = ctx.accounts.snapshot_config.get_current_snapshot(timestamp);

        if current_snapshot.is_none() {
            // No more snapshots to maintain as they are all in the past.
            return Ok(());
        }

        let (current_snapshot_index, _) = current_snapshot.unwrap();

        let source_snapshot_balances = &mut ctx.accounts.source_snapshot_balances;
        let destination_snapshot_balances = &mut ctx.accounts.destination_snapshot_balances;

        source_snapshot_balances.snapshot_balances[current_snapshot_index] =
            Some(ctx.accounts.source.amount);

        destination_snapshot_balances.snapshot_balances[current_snapshot_index] =
            Some(ctx.accounts.destination.amount);

        Ok(())
    }

    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        let account_metas = vec![
            ExtraAccountMeta::new_with_pubkey(&ctx.accounts.snapshot_config.key(), false, false)?,
            ExtraAccountMeta::new_with_seeds(
                &[Seed::AccountKey { index: 1 }, Seed::AccountKey { index: 0 }],
                false,
                true,
            )?,
            ExtraAccountMeta::new_with_seeds(
                &[Seed::AccountKey { index: 1 }, Seed::AccountKey { index: 2 }],
                false,
                true,
            )?,
        ];
        // Allocate extra account PDA account.
        let mint_key = ctx.accounts.mint.key();
        let account_size = ExtraAccountMetaList::size_of(account_metas.len())?;
        let lamports = Rent::get()?.minimum_balance(account_size as usize);

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"extra-account-metas",
            &mint_key.as_ref(),
            &[ctx.bumps.extra_account],
        ]];

        create_account(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.extra_account.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
            lamports,
            account_size as u64,
            ctx.program_id,
        )?;

        // Write the extra account meta list to the extra account PDA.
        let mut data = ctx.accounts.extra_account.try_borrow_mut_data()?;
        ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &account_metas)?;

        msg!(
            "Extra account meta list initialized on {}",
            ctx.accounts.extra_account.key()
        );
        Ok(())
    }

    pub fn fallback<'a>(
        program_id: &Pubkey,
        accounts: &'a [AccountInfo<'a>],
        ix_data: &[u8],
    ) -> Result<()> {
        msg!("Fallback invoked");
        let mut ix_data: &[u8] = ix_data;
        let sighash: [u8; 8] = {
            let mut sighash: [u8; 8] = [0; 8];
            sighash.copy_from_slice(&ix_data[..8]);
            ix_data = &ix_data[8..];
            sighash
        };
        match sighash {
            EXECUTE_IX_TAG_LE => __private::__global::transfer_hook(program_id, accounts, ix_data),
            _ => Err(ProgramError::InvalidInstructionData.into()),
        }
    }
}

#[derive(Accounts)]
#[instruction(max_snapshots: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(init,
    seeds=[b"snapshots", mint.key().as_ref()], bump,
    space=SnapshotConfig::space(max_snapshots),
    payer=payer)]
    pub snapshot_config: Account<'info, SnapshotConfig>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DefineSnapshot<'info> {
    #[account(mut)]
    pub snapshot_config: Account<'info, SnapshotConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ActivateSnapshots<'info> {
    #[account(mut)]
    pub snapshot_config: Account<'info, SnapshotConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitSnapshotBalancesAccount<'info> {
    #[account[mut]]
    pub payer: Signer<'info>,
    /// CHECK: owner of token account to initialize snapshot balances for
    #[account()]
    pub owner: AccountInfo<'info>,
    #[account(seeds=[b"snapshots", mint.key().as_ref()], bump)]
    pub snapshot_config: Account<'info, SnapshotConfig>,
    #[account(
    init,
    seeds=[mint.key().as_ref(), token_account.key().as_ref()], bump,
    payer=payer,
    space=SnapshotTokenAccountBalances::space(snapshot_config.snapshots.len())
    )]
    pub snapshot_balances: Account<'info, SnapshotTokenAccountBalances>,
    pub mint: InterfaceAccount<'info, Mint>,
    // TODO: check for associated token account
    #[account(token::authority=owner)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct TransferHook<'info> {
    /// CHECK:
    pub source: InterfaceAccount<'info, TokenAccount>,
    /// CHECK:
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK:
    pub destination: InterfaceAccount<'info, TokenAccount>,
    /// CHECK:
    pub owner: UncheckedAccount<'info>,
    /// CHECK: must be the extra account PDA
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()], 
        bump
    )]
    pub extra_account_meta_list: AccountInfo<'info>,
    pub snapshot_config: Account<'info, SnapshotConfig>,
    #[account(mut, seeds = [mint.key().as_ref(), source.key().as_ref()], bump)]
    pub source_snapshot_balances: Account<'info, SnapshotTokenAccountBalances>,
    #[account(mut, seeds = [mint.key().as_ref(), destination.key().as_ref()], bump)]
    pub destination_snapshot_balances: Account<'info, SnapshotTokenAccountBalances>,
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: must be the extra account PDA
    #[account(mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()], 
        bump)
    ]
    pub extra_account: AccountInfo<'info>,
    /// CHECK: seed constraint check is enough here
    #[account(seeds=[b"snapshots", mint.key().as_ref()], bump)]
    pub snapshot_config: AccountInfo<'info>,
    /// CHECK:
    pub mint: AccountInfo<'info>,
    /// CHECK:
    pub system_program: Program<'info, System>,
}

#[account]
pub struct SnapshotConfig {
    pub authority: Pubkey,
    pub defined_snapshots: u8,
    pub snapshots: Vec<i64>,
    pub activated_date: Option<i64>,
}

impl SnapshotConfig {
    pub fn space<T: Into<usize>>(num_snapshots: T) -> usize {
        std::mem::size_of::<Pubkey>()
            + std::mem::size_of::<Vec<i64>>()
            + std::mem::size_of::<i64>() * num_snapshots.into()
            + std::mem::size_of::<u8>()
            + std::mem::size_of::<Option<i64>>()
            + 8 // Anchor account discriminator
    }

    pub fn get_current_snapshot(&self, timestamp: i64) -> Option<(usize, i64)> {
        msg!("Getting current snapshot");
        msg!("Current timestamp: {}", timestamp);
        msg!("Activated date: {:?}", self.activated_date);

        msg!("Snapshots: {:?}", self.snapshots);

        let index = self
            .snapshots
            .iter()
            .position(|&snapshot| self.activated_date.unwrap() + snapshot > timestamp);

        let current_snapshot = match index {
            Some(i) => Some((i, self.snapshots[i])),
            None => None,
        };

        msg!("Current snapshot: {:?}", current_snapshot);
        current_snapshot
    }
}

#[account]
pub struct SnapshotTokenAccountBalances {
    pub snapshot_balances: Vec<Option<u64>>,
}

impl SnapshotTokenAccountBalances {
    pub fn space<T: Into<usize>>(num_snapshots: T) -> usize {
        4 + std::mem::size_of::<Option<u64>>() * num_snapshots.into() + 8
    }

    // If snapshot_balance at given index is Some we just return the balance => ez!
    // If balance is None, that means in the period between the given snapshot and the earlier snapshot, no transfer occurred.
    // There could still be a balance at the earlier snapshot, so we need to check that.
    // If there is a balance at the earlier snapshot, we return that balance.
    // If there is no balance at any earlier snapshot, we return 0.
    // TODO: Expose as a getter function with return value don't know how to do that yet
    // TODO: Add tests
    pub fn balance_at_snapshot(&self, snapshot_index: usize) -> u64 {
        let snapshot_balance = self.snapshot_balances[snapshot_index];
        match snapshot_balance {
            Some(balance) => balance,
            None => {
                let mut i = snapshot_index;
                while i > 0 {
                    i -= 1;
                    let snapshot_balance = self.snapshot_balances[i];
                    match snapshot_balance {
                        Some(balance) => return balance,
                        None => continue,
                    }
                }
                0
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    macro_rules! balance_at_snapshot_tests {
        ($($name:ident: $expected:expr,)*) => {
            $(
                #[test]
                fn $name() {
                    let (snapshot_balances, snapshot_index, expected) = $expected;
                    let result = snapshot_balances.balance_at_snapshot(snapshot_index);
                    assert_eq!(result, expected);
                }
            )*
        };
    }

    #[cfg(test)]
    balance_at_snapshot_tests! {
        balance_at_snapshot_test_1: (SnapshotTokenAccountBalances {
            snapshot_balances: vec![Some(100), Some(200), Some(300)]
        }, 0, 100,),
        balance_at_snapshot_test_2: (SnapshotTokenAccountBalances {
            snapshot_balances: vec![Some(100), Some(200), Some(300)]
        }, 1, 200,),
        balance_at_snapshot_test_3: (SnapshotTokenAccountBalances {
            snapshot_balances: vec![Some(100), None, None]
        }, 2, 100,),
        balance_at_snapshot_test_4: (SnapshotTokenAccountBalances {
            snapshot_balances: vec![None, Some(200), None]
        }, 2, 200,),
        balance_at_snapshot_test_5: (SnapshotTokenAccountBalances {
            snapshot_balances: vec![None, None, Some(300)]
        }, 0, 0,),
        balance_at_snapshot_test_6: (SnapshotTokenAccountBalances {
            snapshot_balances: vec![None, None, None]
        }, 0, 0,),
        balance_at_snapshot_test_7: (SnapshotTokenAccountBalances {
            snapshot_balances: vec![Some(100), None, Some(300)]
        }, 1, 100,),
        balance_at_snapshot_test_8: (SnapshotTokenAccountBalances {
            snapshot_balances: vec![Some(100), None, Some(300)]
        }, 2, 300,),
        balance_at_snapshot_test_9: (SnapshotTokenAccountBalances {
            snapshot_balances: vec![None, Some(100),None]
        }, 0, 0,),
          balance_at_snapshot_test_10: (SnapshotTokenAccountBalances {
            snapshot_balances: vec![None, Some(100),None]
        }, 2, 100,),
    }
}
