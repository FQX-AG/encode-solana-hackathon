use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};
use solana_program::clock::UnixTimestamp;

use {
    anchor_spl::token_2022::spl_token_2022::{
        extension::{
            transfer_hook::TransferHookAccount, BaseStateWithExtensions, StateWithExtensions,
        },
        state::Account as Token2022Account,
    },
    spl_transfer_hook_interface::error::TransferHookError,
};

declare_id!("7aeu4HRHR4UwQndRDyh5f7nMwgxgH3rrtLgRntxdivZw");

// Sha256(spl-transfer-hook-interface:execute)[..8]
pub const EXECUTE_IX_TAG_LE: [u8; 8] = [105, 37, 101, 197, 75, 251, 102, 26];

#[error_code]
enum SnapshotHookError {
    #[msg("No snapshot found")]
    NoSnapshotFound,
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

fn update_snapshot_balance<'info>(
    account_info: &'info AccountInfo<'info>,
    amount_change: i64,
) -> Result<()> {
    let mut data = account_info.try_borrow_mut_data()?;
    let mut snapshot_account =
        Account::<'info, SnapshotTokenAccountBalance>::try_from(&account_info)?;
    assert!(snapshot_account.balance >= amount_change.abs() as u64);
    snapshot_account.balance =
        u64::try_from(snapshot_account.balance as i64 + amount_change).unwrap();
    snapshot_account.try_serialize(&mut *data)?;
    Ok(())
}

#[program]
pub mod transfer_snapshot_hook {
    use solana_program::program::invoke_signed;
    use solana_program::system_instruction;
    use spl_pod::primitives::PodBool;
    use spl_tlv_account_resolution::account::ExtraAccountMeta;
    use spl_tlv_account_resolution::seeds::Seed;
    use spl_tlv_account_resolution::state::ExtraAccountMetaList;
    use spl_transfer_hook_interface::collect_extra_account_metas_signer_seeds;
    use spl_transfer_hook_interface::instruction::ExecuteInstruction;

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, num_snapshots: u8) -> Result<()> {
        let snapshot_config = &mut ctx.accounts.snapshot_config;
        snapshot_config.authority = *ctx.accounts.authority.key;
        snapshot_config.snapshots = vec![0; num_snapshots as usize];
        snapshot_config.initialized = false;
        Ok(())
    }

    pub fn transfer_hook<'a>(
        ctx: Context<'_, '_, 'a, 'a, TransferHook>,
        amount: u64,
    ) -> Result<()> {
        let snapshot_config = &mut ctx.accounts.snapshot_config;

        let source_account = &ctx.accounts.source;
        let destination_account = &ctx.accounts.destination;

        check_token_account_is_transferring(&source_account.to_account_info().try_borrow_data()?)?;
        check_token_account_is_transferring(
            &destination_account.to_account_info().try_borrow_data()?,
        )?;

        msg!("Transfer hook invoked");
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

        let timestamp = Clock::get()?.unix_timestamp;

        let current_snapshot = snapshot_config.get_current_snapshot(timestamp);

        require!(
            current_snapshot.is_some(),
            SnapshotHookError::NoSnapshotFound
        );

        let (current_snapshot_index, _) = current_snapshot.unwrap();

        let [source_snapshot_account_info, destination_snapshot_account_info] = [
            &ctx.remaining_accounts[current_snapshot_index], // source snapshot account
            &ctx.remaining_accounts[snapshot_config.snapshots.len() / 2 + current_snapshot_index],
        ];

        update_snapshot_balance(source_snapshot_account_info, -(amount as i64))?;
        update_snapshot_balance(destination_snapshot_account_info, amount as i64)?;

        Ok(())
    }

    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
        num_snapshots: u8,
        bump_seed: u8,
    ) -> Result<()> {
        let mut account_metas = vec![
            ExtraAccountMeta {
                discriminator: 0,
                address_config: ctx.accounts.snapshot_config.key().to_bytes(),
                is_signer: PodBool::from(false),
                is_writable: PodBool::from(true),
            },
            ExtraAccountMeta::new_with_seeds(&[Seed::AccountKey { index: 1 }], false, false)?,
        ];

        for i in 0..num_snapshots {
            account_metas.push(ExtraAccountMeta::new_with_seeds(
                &[
                    Seed::AccountKey { index: 0 },
                    Seed::Literal {
                        bytes: i.to_string().into_bytes(),
                    },
                ],
                false,
                true,
            )?);
        }

        for i in 0..num_snapshots {
            account_metas.push(ExtraAccountMeta::new_with_seeds(
                &[
                    Seed::AccountKey { index: 2 },
                    Seed::Literal {
                        bytes: i.to_string().into_bytes(),
                    },
                ],
                false,
                true,
            )?);
        }

        // Allocate extra account PDA account.
        let mint_key = ctx.accounts.mint.key();
        let bump_seed = [bump_seed];
        let signer_seeds = collect_extra_account_metas_signer_seeds(&mint_key, &bump_seed);
        let account_size = ExtraAccountMetaList::size_of(account_metas.len())?;
        invoke_signed(
            &system_instruction::allocate(ctx.accounts.extra_account.key, account_size as u64),
            &[ctx.accounts.extra_account.clone()],
            &[&signer_seeds],
        )?;
        invoke_signed(
            &system_instruction::assign(ctx.accounts.extra_account.key, ctx.program_id),
            &[ctx.accounts.extra_account.clone()],
            &[&signer_seeds],
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
#[instruction(num_snapshots: u8)]
pub struct Initialize<'info> {
    #[account(init, seeds=[mint.key().as_ref()], bump, payer = authority, space = SnapshotConfig::space(num_snapshots))]
    pub snapshot_config: Account<'info, SnapshotConfig>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
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
        bump)
    ]
    pub extra_account_meta_list: AccountInfo<'info>,
    /// CHECK:
    pub snapshot_config: Account<'info, SnapshotConfig>,
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    /// CHECK: must be the extra account PDA
    #[account(mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()], 
        bump)
    ]
    pub extra_account: AccountInfo<'info>,
    pub snapshot_config: Account<'info, SnapshotConfig>,
    /// CHECK:
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK:
    pub authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct SnapshotConfig {
    pub authority: Pubkey,
    pub initialized: bool,
    pub snapshots: Vec<UnixTimestamp>,
}

impl SnapshotConfig {
    pub fn space<T: Into<usize>>(num_snapshots: T) -> usize {
        std::mem::size_of::<Pubkey>() + num_snapshots.into() * std::mem::size_of::<UnixTimestamp>()
    }

    pub fn get_current_snapshot(&self, timestamp: UnixTimestamp) -> Option<(usize, UnixTimestamp)> {
        let index = self
            .snapshots
            .iter()
            .rposition(|&snapshot| snapshot <= timestamp);
        match index {
            Some(i) => Some((i, self.snapshots[i])),
            None => None,
        }
    }
}

#[account]
pub struct SnapshotTokenAccountBalance {
    pub balance: u64,
}
