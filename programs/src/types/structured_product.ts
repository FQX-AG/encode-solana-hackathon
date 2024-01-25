export type StructuredProduct = {
  "version": "0.1.0",
  "name": "structured_product",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "investor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "issuer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "programTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "investorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "issuerTreasuryWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "structuredProduct",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "investor",
            "type": "publicKey"
          },
          {
            "name": "issuer",
            "type": "publicKey"
          },
          {
            "name": "issuerTreasuryWallet",
            "type": "publicKey"
          }
        ]
      }
    }
  ]
};

export const IDL: StructuredProduct = {
  "version": "0.1.0",
  "name": "structured_product",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "investor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "issuer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "programTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "investorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "issuerTreasuryWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "structuredProduct",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "investor",
            "type": "publicKey"
          },
          {
            "name": "issuer",
            "type": "publicKey"
          },
          {
            "name": "issuerTreasuryWallet",
            "type": "publicKey"
          }
        ]
      }
    }
  ]
};
