export type BrcPriceAuthority = {
  "version": "0.1.0",
  "name": "brc_price_authority",
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
          "name": "structuredProduct",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payment",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "brc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dummyOracle",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "dummyOracleProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProductProgram",
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
          "name": "underlyingSymbol",
          "type": "string"
        },
        {
          "name": "paymentDateOffset",
          "type": "i64"
        },
        {
          "name": "initialPrincipal",
          "type": "u64"
        },
        {
          "name": "barrierInBasisPoints",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setFinalFixingPrice",
      "accounts": [
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "brc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "structuredProduct",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payment",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "dummyOracle",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "dummyOracleProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProductProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "underlyingSymbol",
          "type": "string"
        },
        {
          "name": "paymentDateOffset",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "brc",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "underlyingSymbol",
            "type": "string"
          },
          {
            "name": "initialPrincipal",
            "type": "u64"
          },
          {
            "name": "initialFixingPrice",
            "type": "u64"
          },
          {
            "name": "barrier",
            "type": "u64"
          },
          {
            "name": "finalUnderlyingFixingPrice",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "finalFixingDate",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "finalPrincipal",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "targetPayment",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    }
  ]
};

export const IDL: BrcPriceAuthority = {
  "version": "0.1.0",
  "name": "brc_price_authority",
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
          "name": "structuredProduct",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payment",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "brc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dummyOracle",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "dummyOracleProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProductProgram",
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
          "name": "underlyingSymbol",
          "type": "string"
        },
        {
          "name": "paymentDateOffset",
          "type": "i64"
        },
        {
          "name": "initialPrincipal",
          "type": "u64"
        },
        {
          "name": "barrierInBasisPoints",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setFinalFixingPrice",
      "accounts": [
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "brc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "structuredProduct",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payment",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "dummyOracle",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "dummyOracleProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "structuredProductProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "underlyingSymbol",
          "type": "string"
        },
        {
          "name": "paymentDateOffset",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "brc",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "underlyingSymbol",
            "type": "string"
          },
          {
            "name": "initialPrincipal",
            "type": "u64"
          },
          {
            "name": "initialFixingPrice",
            "type": "u64"
          },
          {
            "name": "barrier",
            "type": "u64"
          },
          {
            "name": "finalUnderlyingFixingPrice",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "finalFixingDate",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "finalPrincipal",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "targetPayment",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    }
  ]
};
