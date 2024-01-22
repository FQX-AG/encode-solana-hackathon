import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import {TreasuryWallet} from "../target/types/treasury_wallet";
import {Keypair, PublicKey, sendAndConfirmTransaction, Signer, SystemProgram, Transaction} from "@solana/web3.js";
import {newAccountWithLamports, PDA} from "./utils";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction,
    createInitializeMint2Instruction, createMintToInstruction, createTransferCheckedInstruction,
    getAssociatedTokenAddressSync,
    getMinimumBalanceForRentExemptMint, getOrCreateAssociatedTokenAccount,
    MINT_SIZE,
    mintTo,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import BN from "bn.js";
import {simulateTransaction} from "@coral-xyz/anchor/dist/cjs/utils/rpc";
import {expect} from "chai";

describe("treasury-wallet", () => {
    const program = anchor.workspace.TreasuryWallet as Program<TreasuryWallet>;

    anchor.setProvider(anchor.AnchorProvider.env());

    let owner: Signer;
    let ownerATA: PublicKey;
    let withdrawAuthority: Signer;
    let withdrawAuthorityATA: PublicKey;
    let mint: Keypair;
    let treasuryWallet: Keypair;
    let treasuryWalletAuthorityPda: PDA;
    let treasuryWalletATA: PublicKey;

    const provider = anchor.getProvider();

    before(async () => {
        owner = await newAccountWithLamports(provider.connection);
        withdrawAuthority = await newAccountWithLamports(provider.connection);
        mint = anchor.web3.Keypair.generate();
        treasuryWallet = anchor.web3.Keypair.generate();

        ownerATA = getAssociatedTokenAddressSync(
            mint.publicKey,
            owner.publicKey,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        withdrawAuthorityATA = getAssociatedTokenAddressSync(
            mint.publicKey,
            withdrawAuthority.publicKey,
             true,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const lamports = await getMinimumBalanceForRentExemptMint(provider.connection);

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: owner.publicKey,
                newAccountPubkey: mint.publicKey,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMint2Instruction(mint.publicKey, 6, owner.publicKey, null, TOKEN_PROGRAM_ID)
        );

        await sendAndConfirmTransaction(provider.connection, transaction, [owner, mint], {commitment: "confirmed"});

        console.log("Created mint: ", mint.publicKey.toBase58());

        const [_treasuryAuthorityPubkey, _treasuryAuthorityBump] = PublicKey.findProgramAddressSync(
            [treasuryWallet.publicKey.toBuffer()], program.programId);

        treasuryWalletAuthorityPda = {publicKey: _treasuryAuthorityPubkey, bump: _treasuryAuthorityBump};

        treasuryWalletATA = getAssociatedTokenAddressSync(
            mint.publicKey,
            treasuryWalletAuthorityPda.publicKey,
            true,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );


        console.log(`minting tokens to owner ATA: ${ownerATA.toBase58()}`);

        const mintToTx = new Transaction().add(
            createAssociatedTokenAccountInstruction(owner.publicKey, ownerATA, owner.publicKey, mint.publicKey, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
            createMintToInstruction(mint.publicKey, ownerATA, owner.publicKey, 1000000000, [], TOKEN_PROGRAM_ID)
        )

        await sendAndConfirmTransaction(provider.connection, mintToTx, [owner], {commitment: "confirmed"});
        console.log('minted tokens to owner');

    });

    it("happy flow", async () => {
        const tx = new Transaction().add(
            await program.methods.initialize().accounts({
                owner: owner.publicKey,
                treasuryWallet: treasuryWallet.publicKey,
                treasuryAuthority: treasuryWalletAuthorityPda.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }).instruction()
        )

        await sendAndConfirmTransaction(provider.connection, tx, [owner, treasuryWallet], {commitment: "confirmed"});
        console.log(`initialized treasury wallet: ${treasuryWallet.publicKey.toBase58()}`);

        const fundTreasuryTokenATA = new Transaction().add(
            createAssociatedTokenAccountInstruction(owner.publicKey, treasuryWalletATA, treasuryWalletAuthorityPda.publicKey, mint.publicKey, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
            createTransferCheckedInstruction(ownerATA, mint.publicKey, treasuryWalletATA, owner.publicKey, 1000000000, 6)
        )

        await sendAndConfirmTransaction(provider.connection, fundTreasuryTokenATA, [owner], {commitment: "confirmed"});

        console.log(`funded treasury wallet with tokens`);

        const [_withDrawAuthorizationPubkey, _withDrawAuthorizationBump] = PublicKey.findProgramAddressSync(
            [treasuryWallet.publicKey.toBuffer(), withdrawAuthority.publicKey.toBuffer()], program.programId);

        const withdrawAuthorizationPda = {publicKey: _withDrawAuthorizationPubkey, bump: _withDrawAuthorizationBump};

        const addWithdrawAuthorityTx = new Transaction().add(
            await program.methods.addWithdrawAuthorization().accounts({
                owner: owner.publicKey,
                treasuryWallet: treasuryWallet.publicKey,
                withdrawAuthorization:withdrawAuthorizationPda.publicKey,
                authority: withdrawAuthority.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            }).instruction()
        );

        console.log(`adding withdraw authority: ${withdrawAuthority.publicKey.toBase58()}`);
        await sendAndConfirmTransaction(provider.connection, addWithdrawAuthorityTx, [owner], {commitment: "confirmed"});
        console.log(`added withdraw authority: ${withdrawAuthority.publicKey.toBase58()}`);

        const withdrawTx = new Transaction().add(
            createAssociatedTokenAccountInstruction(
                withdrawAuthority.publicKey,
                withdrawAuthorityATA,
                withdrawAuthority.publicKey,
                mint.publicKey,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID),
            await program.methods.withdraw(new BN(1000)).accounts({
                authority: withdrawAuthority.publicKey,
                treasuryWallet: treasuryWallet.publicKey,
                mint: mint.publicKey,
                treasuryWalletTokenAccount: treasuryWalletATA,
                treasuryAuthority: treasuryWalletAuthorityPda.publicKey,
                withdrawAuthorization: withdrawAuthorizationPda.publicKey,
                destination: withdrawAuthorityATA,
                tokenProgram: TOKEN_PROGRAM_ID,
            }).instruction());

        console.log(`withdrawing tokens to withdraw authority token account: ${withdrawAuthorityATA.toBase58()}`);
        await sendAndConfirmTransaction(provider.connection, withdrawTx, [withdrawAuthority], {commitment: "confirmed"});

        const withdrawAuthorityTokenAccount = await getOrCreateAssociatedTokenAccount(provider.connection, withdrawAuthority, mint.publicKey, withdrawAuthority.publicKey, false);

        expect(withdrawAuthorityTokenAccount.amount).to.equal(1000n);
    });

});