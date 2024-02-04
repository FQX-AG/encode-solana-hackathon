# Obligate Encode x Solana Hackathon - **[Demo :rocket:](https://encode-solana-hackathon.obligate.com)**

Check out our [demo :rocket:](https://encode-solana-hackathon.obligate.com)!

## Background
The goal for this demo was to create a new way for issuers of structured products to issue
and manage their products on the Solana blockchain.
The product chosen for this demo is a **Barrier Reverse Convertible**,
a structured product that is popular in the traditional finance world.
BRC is an investment product with a high guaranteed coupon, 
and a variable repayment of the principal that depends on the performance of the underlying asset:
* If the final price of the underlying is above the barrier level, 100% of the initial investment is repaid back; 
* If it’s below, then repayment amount shall be recalculated as the performance of the underlying asset.

It allows investors to give up the potential upside exposure to the underlying asset in exchange for an enhanced coupon. 
The ideal market scenario for reverse convertibles is the expectation of a sideways trending market.

See the attached graph for a visual representation of the product.

![graph.png](assets/graph.png)

In most of the markets, the product is issued by a financial institution on the request of an investor. 
The investor requests a product with certain parameters in mind. 
And potential issuers compete on the yield they can offer on the product.
Once the investor accepts an offer, the issuer will issue the product to the investor.

## Challenges with current solutions
Current solutions for issuing structured products are centralized and require a lot of 
intermediaries. This makes the process of issuing and managing structured products slow and cumbersome.

As an example the final fixing date, maturity and settlement of the product are 3-7 days apart from each other.
They also require a lot of manual intervention due to lack of automation
of price fixing and payment settlement.

Since Structured Products are considered to be securities in most jurisdictions, 
they required to be properly registered and stored in segregated accounts.

Opaqueness of the pricing of Structured Products might hurt market integrity and decreases overall investors' confidence.

## Challenges with pure blockchain solutions
Pure blockchain/DeFi solutions don't provide the legal certainty that is required for structured products.
Issuers and investors usually like to negotiate the terms of the product in private.
Holding a Structured Product creates risk exposure of the investor to both the Underlying Asset and the Issuer.
Hence pure DeFi solution with anonymous Issuers and therefore unknown credit risk is generally avoided by investors.

## Challenges with SPL Token before Token 2022
With the old Token program it was not easily possible to maintain snapshots of token account balances.
It was also not directly possible to have rules on token transfers, that depending on the issuer may require
tokens to stay within a whitelisted ecosystem.

Specifically the transfer hook in token 2022 is what was missing in the old token program to allow fully 
functional structured products to be issued on Solana.

## Solution
The solution we aim to demonstrate with this demo is a hybrid where the negotiation of the product
is done on a platform and legal certainty is provided Obligate's legal framework based the Swiss law for ledger-based securities.
(The demo does not include the complete legal framework, but it is a part of the Obligate platform.)

The issuer submits their offer which includes the **yield** and **initial fixing price**, 
as a Solana transaction signed offline. This transaction will only become valid if the investor
signs the transaction with their private key. 
This way the negotiation of the product is done in private.

The investor will accept the offer by signing and broadcasting the transaction to the Solana network.
The investor will pay for and receive the product issued by the issuer in an atomic transaction.

(On production there would be a third signature by Obligate signing off on the legality of the product.)

By automating all parts of the product lifecycle we are able to payout coupons, set the final fixing price 
and final principal and payout the principal to the investor without any manual intervention, as long as the
investor carries enough funds on a **Treasury wallet** on Solana.

# Technical implementation

There are five Solana programs in this repository that are used to issue and manage the structured product.

1. **Structured Product Program** - This program is used to initialize other programs, configure and manage payments and issue the structured product as an SPL token.
2. **Transfer Snapshot Hook** - This program is used to maintain snapshots of token account balances at payment dates.
3. **BRC Price Authority** - This program is used to set the final fixing price and final principal of the structured product. It is set as the price authority on the principal payment.
4. **Treasury Wallet** - This program allows the issuer to deposit funds into a treasury wallet which can automatically pay out coupons and principal to the investor given a signed authorization to the structured product program.
5. **Dummy Oracle** - This program is used to simulate an oracle that sets initial and final fixing price of the underlying asset.


## Structured Product Program
This is the main entry point to be able to issue the product. It's a wrapper around creating metadata, the payment accounts and corresponding snapshots.
To be able to issue it's the mint authority to the mint and sets up the transfer hook for the mint.
It's modular in the sense that any address can be a price authority for a payment => Easy extension to other structured products.

Throughout the lifecycle it's currently able to pull payments from a **treasury wallet** that authorized the **structured product pda** to do withdrawals.

Each payment carries its own token account from which it can distribute/settle the payment for every investor that was holding the token at the corresponding snapshot.

## Transfer snapshot hook
This program can be used for any Token 2022 mint and stores a certan number of snapshots which define a timestamp offset relative to the snapshot config's activation date.
On a token transfer the invokation of the hook will update the snapshot_token_account_balances account's balance at the current_snapshot_index for source and destination token accounts.

The snapshot balance is then calculated with the following algorithm:
```rust
// If snapshot_balance at given index is `Some` we just return the balance => ez!
// If balance is `None`, that means in the period between the given snapshot and the earlier snapshot, no transfer occurred.
// There could still be a balance at the earlier snapshot, so we need to check that.
// If there is a balance at the earlier snapshot, we return that balance.
// If there is no balance at any earlier snapshot, we return 0.
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
```

This is useful for any token with scheduled payments or other events that depend on the token balance at a certain point in time
and can be used completely independently of the structured product program.

It could also be used within another transfer-hook that combines multiple hooks together, e.g. a check for whitelist,
for compliance reasons.

## BRC Price authority
This program is given an oracle (in our case our dummy oracle) and an initial fixing price during initialization. It also expects a **Payment account**
which should be updated at the maturity date. 

We can then "crank" the BRC price authority to set the final fixing price and final principal of the structured product
at the payment given during initialization.

The calculation for the final principal is implemented in the following function:

```rust
pub fn calc_final_principal(
    initial_principal: u64,
    initial_fixing_price: u64,
    barrier: u64,
    final_fixing_price: u64,
) -> u64 {
    match final_fixing_price {
        final_fixing_price if final_fixing_price <= barrier => {
            ((initial_principal as u128 * final_fixing_price as u128)
                / initial_fixing_price as u128) as u64
        }
        _ => initial_principal,
    }
}
```


We are able to do this in the same transaction as pulling the issuer's repayment from the treasury wallet,
and distribute the final principal to the investor.

## Treasury Wallet
This program is used to deposit funds into a treasury wallet, which exposes a "Withdraw" instruction,
that can be called by addresses that have previously been authorized to do so.
We authorize the **structured product pda** to do withdrawals from the treasury wallet in the same transaction
where we initialize the structured product. 

## Dummy Oracle
This program is used to simulate an oracle for the BRC price authority to get the price from.
It's a simple program that can be initialized with a price and then continuously update the price by the update authority.


# Disclaimer
This is a demo, not a complete solution and most likely not secure. 
It's not audited and should not be used in production.
Currently, it shouldn't be used at all, as there's no license, but we'll add an appropriate license later.
