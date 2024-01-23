use anchor_lang::prelude::*;
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

declare_id!("7aeu4HRHR4UwQndRDyh5f7nMwgxgH3rrtLgRntxdivZw");

// Sha256(spl-transfer-hook-interface:execute)[..8]
pub const EXECUTE_IX_TAG_LE: [u8; 8] = [105, 37, 101, 197, 75, 251, 102, 26];

#[error_code]
enum SnapshotHookError {
    #[msg("No snapshot found")]
    NoSnapshotFound,
    #[msg("Already initialized")]
    AlreadyInitialized,
    #[msg("Not initialized")]
    NotInitialized,
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
    use solana_program::program::invoke_signed;
    use solana_program::system_instruction;
    use spl_pod::primitives::PodBool;
    use spl_tlv_account_resolution::account::ExtraAccountMeta;
    use spl_tlv_account_resolution::seeds::Seed;
    use spl_tlv_account_resolution::state::ExtraAccountMetaList;
    use spl_transfer_hook_interface::collect_extra_account_metas_signer_seeds;
    use spl_transfer_hook_interface::instruction::ExecuteInstruction;

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, snapshots: Vec<i64>) -> Result<()> {
        let snapshot_config = &mut ctx.accounts.snapshot_config;
        require!(
            !snapshot_config.initialized,
            SnapshotHookError::AlreadyInitialized
        );
        let now = Clock::get()?.unix_timestamp;
        require!(
            snapshots.iter().find(|&&snapshot| snapshot < now).is_none(),
            SnapshotHookError::InvalidTimestamp
        );

        let correct_snapshots = &mut snapshots.clone();
        correct_snapshots.sort_unstable();
        correct_snapshots.dedup();

        // make immutable
        require!(
            correct_snapshots.to_vec().eq(&snapshots),
            SnapshotHookError::InvalidTimestamp
        );

        snapshot_config.authority = *ctx.accounts.authority.key;
        snapshot_config.snapshots = snapshots;
        snapshot_config.initialized = true;
        Ok(())
    }

    pub fn init_snapshot_balances_account(ctx: Context<InitSnapshotBalancesAccount>) -> Result<()> {
        let snapshot_config = &mut ctx.accounts.snapshot_config;
        require!(
            snapshot_config.initialized,
            SnapshotHookError::NotInitialized
        );
        let num_snapshots = snapshot_config.snapshots.len();
        let snapshot_balances = &mut ctx.accounts.snapshot_balances;
        snapshot_balances.snapshot_balances = vec![None; num_snapshots];
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

        let source_snapshot_balances = &mut ctx.accounts.source_snapshot_balances;
        let destination_snapshot_balances = &mut ctx.accounts.destination_snapshot_balances;

        assert!(
            source_snapshot_balances.snapshot_balances[current_snapshot_index].is_some()
                && source_snapshot_balances.snapshot_balances[current_snapshot_index].unwrap()
                    >= amount,
            "PANIC: Incorrect transfer with insufficient funds"
        );

        source_snapshot_balances.snapshot_balances[current_snapshot_index] = Some(
            source_snapshot_balances.snapshot_balances[current_snapshot_index].unwrap() - amount,
        );

        destination_snapshot_balances.snapshot_balances[current_snapshot_index] = Some(
            destination_snapshot_balances.snapshot_balances[current_snapshot_index].unwrap_or(0)
                + amount,
        );

        Ok(())
    }

    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
        bump_seed: u8,
    ) -> Result<()> {
        let account_metas = vec![
            ExtraAccountMeta {
                discriminator: 0,
                address_config: ctx.accounts.snapshot_config.key().to_bytes(),
                is_signer: PodBool::from(false),
                is_writable: PodBool::from(true),
            },
            ExtraAccountMeta::new_with_seeds(&[Seed::AccountKey { index: 1 }], false, false)?,
            ExtraAccountMeta::new_with_seeds(&[Seed::AccountKey { index: 0 }], false, false)?,
            ExtraAccountMeta::new_with_seeds(&[Seed::AccountKey { index: 2 }], false, false)?,
        ];
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
    #[account(zero, seeds=[mint.key().as_ref()], bump)]
    pub snapshot_config: Account<'info, SnapshotConfig>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(num_snapshots: u8)]
pub struct InitSnapshotBalancesAccount<'info> {
    #[account()]
    pub snapshot_config: Account<'info, SnapshotConfig>,
    #[account(zero, seeds=[mint.key().as_ref(), token_account.key().as_ref()], bump)]
    pub snapshot_balances: Account<'info, SnapshotTokenAccountBalances>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(token::mint = mint)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
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
    /// CHECK:
    pub snapshot_config: Account<'info, SnapshotConfig>,
    #[account(mut, seeds = [mint.key().as_ref(),source.key().as_ref()], bump)]
    pub source_snapshot_balances: Account<'info, SnapshotTokenAccountBalances>,
    #[account(mut, seeds = [mint.key().as_ref(), destination.key().as_ref()], bump)]
    pub destination_snapshot_balances: Account<'info, SnapshotTokenAccountBalances>,
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
    pub snapshots: Vec<i64>,
}

impl SnapshotConfig {
    pub fn space<T: Into<usize>>(num_snapshots: T) -> usize {
        std::mem::size_of::<Pubkey>() + num_snapshots.into() * std::mem::size_of::<i64>()
    }

    pub fn get_current_snapshot(&self, timestamp: i64) -> Option<(usize, i64)> {
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
pub struct SnapshotTokenAccountBalances {
    pub snapshot_balances: Vec<Option<u64>>,
}
