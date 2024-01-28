use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, Token2022, TokenAccount};

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
    use solana_program::program::invoke_signed;
    use solana_program::system_instruction;
    use spl_pod::primitives::PodBool;
    use spl_tlv_account_resolution::account::ExtraAccountMeta;
    use spl_tlv_account_resolution::seeds::Seed;
    use spl_tlv_account_resolution::state::ExtraAccountMetaList;
    use spl_transfer_hook_interface::collect_extra_account_metas_signer_seeds;
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
        let snapshot_config = &mut ctx.accounts.snapshot_config;

        let source_account = &ctx.accounts.source;
        let destination_account = &ctx.accounts.destination;

        check_token_account_is_transferring(&source_account.to_account_info().try_borrow_data()?)?;
        check_token_account_is_transferring(
            &destination_account.to_account_info().try_borrow_data()?,
        )?;

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
    /// CHECK: authority to add snapshots isn't verified
    pub authority: AccountInfo<'info>,
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
    pub defined_snapshots: u8,
    pub snapshots: Vec<i64>,
    pub activated_date: Option<i64>,
}

impl SnapshotConfig {
    pub fn space<T: Into<usize>>(num_snapshots: T) -> usize {
        std::mem::size_of::<Pubkey>()
            + 4 // Vector structure size
            + num_snapshots.into() * std::mem::size_of::<i64>()
            + std::mem::size_of::<u8>()
            + std::mem::size_of::<bool>()
            + 8 // Anchor account discriminator
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

impl SnapshotTokenAccountBalances {
    pub fn space<T: Into<usize>>(num_snapshots: T) -> usize {
        4 + std::mem::size_of::<Option<u64>>() * num_snapshots.into() + 8
    }
}
