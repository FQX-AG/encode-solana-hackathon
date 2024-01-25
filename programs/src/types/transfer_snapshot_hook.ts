export type TransferSnapshotHook = {
  "version": "0.1.0",
  "name": "transfer_snapshot_hook",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "snapshotConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "snapshots",
          "type": {
            "vec": "i64"
          }
        }
      ]
    },
    {
      "name": "initSnapshotBalancesAccount",
      "accounts": [
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotBalances",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "transferHook",
      "accounts": [
        {
          "name": "source",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destination",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "extraAccountMetaList",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sourceSnapshotBalances",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationSnapshotBalances",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeExtraAccountMetaList",
      "accounts": [
        {
          "name": "extraAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
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
          "name": "bumpSeed",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "snapshotConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "snapshots",
            "type": {
              "vec": "i64"
            }
          }
        ]
      }
    },
    {
      "name": "snapshotTokenAccountBalances",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "snapshotBalances",
            "type": {
              "vec": {
                "option": "u64"
              }
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NoSnapshotFound",
      "msg": "No snapshot found"
    },
    {
      "code": 6001,
      "name": "AlreadyInitialized",
      "msg": "Already initialized"
    },
    {
      "code": 6002,
      "name": "NotInitialized",
      "msg": "Not initialized"
    },
    {
      "code": 6003,
      "name": "InvalidTimestamp",
      "msg": "Invalid timestamp"
    }
  ]
};

export const IDL: TransferSnapshotHook = {
  "version": "0.1.0",
  "name": "transfer_snapshot_hook",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "snapshotConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "snapshots",
          "type": {
            "vec": "i64"
          }
        }
      ]
    },
    {
      "name": "initSnapshotBalancesAccount",
      "accounts": [
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotBalances",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "transferHook",
      "accounts": [
        {
          "name": "source",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destination",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "extraAccountMetaList",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sourceSnapshotBalances",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationSnapshotBalances",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeExtraAccountMetaList",
      "accounts": [
        {
          "name": "extraAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "snapshotConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
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
          "name": "bumpSeed",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "snapshotConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "snapshots",
            "type": {
              "vec": "i64"
            }
          }
        ]
      }
    },
    {
      "name": "snapshotTokenAccountBalances",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "snapshotBalances",
            "type": {
              "vec": {
                "option": "u64"
              }
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NoSnapshotFound",
      "msg": "No snapshot found"
    },
    {
      "code": 6001,
      "name": "AlreadyInitialized",
      "msg": "Already initialized"
    },
    {
      "code": 6002,
      "name": "NotInitialized",
      "msg": "Not initialized"
    },
    {
      "code": 6003,
      "name": "InvalidTimestamp",
      "msg": "Invalid timestamp"
    }
  ]
};
