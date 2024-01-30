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
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
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
          "name": "extraAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "snapshotTransferHookProgram",
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
          "name": "maxSnapshots",
          "type": "u8"
        },
        {
          "name": "paymentAmountPerUnit",
          "type": "u64"
        },
        {
          "name": "supply",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addStaticPayment",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
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
          "name": "snapshotConfig",
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
          "name": "snapshotTransferHookProgram",
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
          "name": "principal",
          "type": "bool"
        },
        {
          "name": "paymentDateOffset",
          "type": "i64"
        },
        {
          "name": "pricePerUnit",
          "type": "u64"
        }
      ]
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
          "name": "snapshotConfig",
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
          "name": "priceAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotTransferHookProgram",
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
          "name": "principal",
          "type": "bool"
        },
        {
          "name": "paymentDateOffset",
          "type": "i64"
        }
      ]
    },
    {
      "name": "payIssuance",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
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
          "name": "payerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProductTokenAccount",
          "isMut": true,
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
      "args": []
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
          "name": "snapshotConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraAccountMetaList",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "programTokenSnapshotBalancesAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "investorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "investorTokenSnapshotBalancesAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "snapshotTransferHookProgram",
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
      "args": []
    },
    {
      "name": "withdrawIssuanceProceeds",
      "accounts": [
        {
          "name": "payer",
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
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "beneficiaryTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProductTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
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
          "name": "paymentDateOffset",
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
          "name": "paymentDateOffset",
          "type": "i64"
        }
      ]
    },
    {
      "name": "settlePayment",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
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
          "name": "snapshotConfig",
          "isMut": false,
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
          "name": "paymentPaid",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "beneficiary",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "beneficiaryTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "beneficiarySnapshotBalancesAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "beneficiaryPaymentTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "snapshotTransferHookProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "paymentDateOffset",
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
            "name": "supply",
            "type": "u64"
          },
          {
            "name": "issuerTreasuryWallet",
            "type": "publicKey"
          },
          {
            "name": "issuancePaymentMint",
            "type": "publicKey"
          },
          {
            "name": "issuancePaymentAmountPerUnit",
            "type": "u64"
          },
          {
            "name": "paid",
            "type": "bool"
          },
          {
            "name": "numPayments",
            "type": "u8"
          },
          {
            "name": "principalDefined",
            "type": "bool"
          },
          {
            "name": "issuanceDate",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
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
            "name": "principal",
            "type": "bool"
          },
          {
            "name": "paid",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "paymentPaid",
      "type": {
        "kind": "struct",
        "fields": [
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
      "name": "Unpaid",
      "msg": "Issuance not paid for"
    },
    {
      "code": 6006,
      "name": "AlreadyIssued",
      "msg": "Already issued"
    },
    {
      "code": 6007,
      "name": "DateNotInPast",
      "msg": "Date not in past"
    },
    {
      "code": 6008,
      "name": "DateNotInFuture",
      "msg": "Date not in future"
    },
    {
      "code": 6009,
      "name": "InvalidPaymentDate",
      "msg": "Invalid date"
    },
    {
      "code": 6010,
      "name": "PrincipalUndefined",
      "msg": "Principal undefined"
    },
    {
      "code": 6011,
      "name": "InsufficientBalance",
      "msg": "Insufficient balance"
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
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
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
          "name": "extraAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "snapshotTransferHookProgram",
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
          "name": "maxSnapshots",
          "type": "u8"
        },
        {
          "name": "paymentAmountPerUnit",
          "type": "u64"
        },
        {
          "name": "supply",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addStaticPayment",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
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
          "name": "snapshotConfig",
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
          "name": "snapshotTransferHookProgram",
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
          "name": "principal",
          "type": "bool"
        },
        {
          "name": "paymentDateOffset",
          "type": "i64"
        },
        {
          "name": "pricePerUnit",
          "type": "u64"
        }
      ]
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
          "name": "snapshotConfig",
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
          "name": "priceAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotTransferHookProgram",
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
          "name": "principal",
          "type": "bool"
        },
        {
          "name": "paymentDateOffset",
          "type": "i64"
        }
      ]
    },
    {
      "name": "payIssuance",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
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
          "name": "payerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProductTokenAccount",
          "isMut": true,
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
      "args": []
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
          "name": "snapshotConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraAccountMetaList",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "programTokenSnapshotBalancesAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "investorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "investorTokenSnapshotBalancesAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "snapshotTransferHookProgram",
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
      "args": []
    },
    {
      "name": "withdrawIssuanceProceeds",
      "accounts": [
        {
          "name": "payer",
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
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProduct",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "beneficiaryTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProductTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
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
          "name": "paymentDateOffset",
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
          "name": "paymentDateOffset",
          "type": "i64"
        }
      ]
    },
    {
      "name": "settlePayment",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
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
          "name": "snapshotConfig",
          "isMut": false,
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
          "name": "paymentPaid",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "beneficiary",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "beneficiaryTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "beneficiarySnapshotBalancesAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "beneficiaryPaymentTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "snapshotTransferHookProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "paymentDateOffset",
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
            "name": "supply",
            "type": "u64"
          },
          {
            "name": "issuerTreasuryWallet",
            "type": "publicKey"
          },
          {
            "name": "issuancePaymentMint",
            "type": "publicKey"
          },
          {
            "name": "issuancePaymentAmountPerUnit",
            "type": "u64"
          },
          {
            "name": "paid",
            "type": "bool"
          },
          {
            "name": "numPayments",
            "type": "u8"
          },
          {
            "name": "principalDefined",
            "type": "bool"
          },
          {
            "name": "issuanceDate",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
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
            "name": "principal",
            "type": "bool"
          },
          {
            "name": "paid",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "paymentPaid",
      "type": {
        "kind": "struct",
        "fields": [
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
      "name": "Unpaid",
      "msg": "Issuance not paid for"
    },
    {
      "code": 6006,
      "name": "AlreadyIssued",
      "msg": "Already issued"
    },
    {
      "code": 6007,
      "name": "DateNotInPast",
      "msg": "Date not in past"
    },
    {
      "code": 6008,
      "name": "DateNotInFuture",
      "msg": "Date not in future"
    },
    {
      "code": 6009,
      "name": "InvalidPaymentDate",
      "msg": "Invalid date"
    },
    {
      "code": 6010,
      "name": "PrincipalUndefined",
      "msg": "Principal undefined"
    },
    {
      "code": 6011,
      "name": "InsufficientBalance",
      "msg": "Insufficient balance"
    }
  ]
};
