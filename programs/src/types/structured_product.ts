export type StructuredProduct = {
  "version": "0.1.0",
  "name": "structured_product",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "investor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "issuer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "issuerTreasuryWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWalletProgram",
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
      "args": []
    },
    {
      "name": "addVariablePayment",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payment",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "paymentRedemptionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "priceAuthority",
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
          "name": "paymentDate",
          "type": "i64"
        }
      ]
    },
    {
      "name": "issue",
      "accounts": [
        {
          "name": "investor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "issuer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
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
          "name": "supply",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setPaymentPrice",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payment",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "paymentDate",
          "type": "i64"
        },
        {
          "name": "pricePerUnit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "pullPayment",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "withdrawalAuthorization",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWalletTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payment",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryWalletProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
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
          "name": "paymentDate",
          "type": "i64"
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
            "name": "authority",
            "type": "publicKey"
          },
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
          },
          {
            "name": "issued",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "payment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "paymentRedemptionMint",
            "type": "publicKey"
          },
          {
            "name": "paymentMint",
            "type": "publicKey"
          },
          {
            "name": "priceAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "pricePerUnit",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "paid",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidOwner",
      "msg": "Invalid owner"
    },
    {
      "code": 6001,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6002,
      "name": "PaymentAmountAlreadySet",
      "msg": "Payment amount already Set"
    },
    {
      "code": 6003,
      "name": "PaymentAmountNotSet",
      "msg": "Payment amount not set"
    },
    {
      "code": 6004,
      "name": "AlreadyPaid",
      "msg": "Already paid"
    },
    {
      "code": 6005,
      "name": "AlreadyIssued",
      "msg": "Already issued"
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
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "investor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "issuer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "issuerTreasuryWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWalletProgram",
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
      "args": []
    },
    {
      "name": "addVariablePayment",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payment",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "paymentRedemptionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "priceAuthority",
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
          "name": "paymentDate",
          "type": "i64"
        }
      ]
    },
    {
      "name": "issue",
      "accounts": [
        {
          "name": "investor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "issuer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
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
          "name": "supply",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setPaymentPrice",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payment",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "paymentDate",
          "type": "i64"
        },
        {
          "name": "pricePerUnit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "pullPayment",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "withdrawalAuthorization",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWalletTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payment",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryWalletProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
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
          "name": "paymentDate",
          "type": "i64"
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
            "name": "authority",
            "type": "publicKey"
          },
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
          },
          {
            "name": "issued",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "payment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "paymentRedemptionMint",
            "type": "publicKey"
          },
          {
            "name": "paymentMint",
            "type": "publicKey"
          },
          {
            "name": "priceAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "pricePerUnit",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "paid",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidOwner",
      "msg": "Invalid owner"
    },
    {
      "code": 6001,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6002,
      "name": "PaymentAmountAlreadySet",
      "msg": "Payment amount already Set"
    },
    {
      "code": 6003,
      "name": "PaymentAmountNotSet",
      "msg": "Payment amount not set"
    },
    {
      "code": 6004,
      "name": "AlreadyPaid",
      "msg": "Already paid"
    },
    {
      "code": 6005,
      "name": "AlreadyIssued",
      "msg": "Already issued"
    }
  ]
};
