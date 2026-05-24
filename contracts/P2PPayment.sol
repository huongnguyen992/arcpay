// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/**
 * @title P2PPayment
 * @notice Gửi/nhận USDC trực tiếp trên Arc Testnet, có memo và lịch sử onchain.
 */
contract P2PPayment {
    // USDC ERC-20 trên Arc Testnet (6 decimals)
    address public constant USDC = 0x3600000000000000000000000000000000000000;

    uint256 private _counter;

    struct Payment {
        uint256 id;
        address sender;
        address recipient;
        uint256 amount;     // 6 decimals: 1 USDC = 1_000_000
        string  memo;
        uint256 timestamp;
    }

    mapping(uint256 => Payment) public payments;
    mapping(address => uint256[]) private _sent;
    mapping(address => uint256[]) private _received;

    event PaymentSent(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        string  memo,
        uint256 timestamp
    );

    error ZeroAmount();
    error ZeroAddress();
    error SelfPayment();
    error TransferFailed();

    /// @notice Gửi USDC. Phải approve trước: USDC.approve(contractAddress, amount)
    function send(address recipient, uint256 amount, string calldata memo)
        external returns (uint256 id)
    {
        if (amount == 0)             revert ZeroAmount();
        if (recipient == address(0)) revert ZeroAddress();
        if (recipient == msg.sender) revert SelfPayment();

        bool ok = IERC20(USDC).transferFrom(msg.sender, recipient, amount);
        if (!ok) revert TransferFailed();

        id = ++_counter;
        payments[id] = Payment(id, msg.sender, recipient, amount, memo, block.timestamp);
        _sent[msg.sender].push(id);
        _received[recipient].push(id);

        emit PaymentSent(id, msg.sender, recipient, amount, memo, block.timestamp);
    }

    function getSentPayments(address a) external view returns (uint256[] memory) {
        return _sent[a];
    }

    function getReceivedPayments(address a) external view returns (uint256[] memory) {
        return _received[a];
    }

    function getPaymentsBatch(uint256[] calldata ids)
        external view returns (Payment[] memory result)
    {
        result = new Payment[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) result[i] = payments[ids[i]];
    }

    function totalPayments() external view returns (uint256) { return _counter; }
}
