// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.11;

contract PrivacyPreservingDelivery {
    //address agentAddr;
    mapping(address => bool) agentAddr;
    uint256 start;
    address owner;
    CommitChoice[] commits;
    Stages stage;
    uint8 commitIndex;
    bool committed = false;
    uint256 orderID;

    enum Stages {
        InitialCommit,
        FirstReveal,
        SecondReveal,
        ThirdReveal,
        FourthReveal,
        FifthReveal,
        SixthReveal,
        Delivered
    }

    struct CommitChoice {
        string commitment;
        uint64 block;
        bool revealed;
    }

    constructor() {
        start = block.timestamp;
        owner = msg.sender;
    }

    modifier restricted() {
        require(msg.sender == owner);
        _;
    }

    modifier isAgent() {
        require(agentAddr[msg.sender] == true);
        require(msg.sender != owner);
        _;
    }

    modifier isNotAgentandOwner() {
        require(agentAddr[msg.sender] == false);
        require(msg.sender != owner);
        _;
    }

    modifier iscontact(address _addr) {
        require(isContract(_addr) == false);
        _;
    }

    function isContract(address _addr) private view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    function addAgent(address _address)
        external
        payable
        restricted
        returns (bool)
    {
        agentAddr[_address] = true;
        return true;
    }

    event commitEvent(bool result);

    function commitAddresses(
        string memory dataHash1,
        string memory dataHash2,
        string memory dataHash3,
        string memory dataHash4,
        string memory dataHash5,
        string memory dataHash6
    ) public isNotAgentandOwner returns (bool) {
        stage = Stages.InitialCommit;
        commitIndex = 0;
        commit(dataHash1);
        commit(dataHash2);
        commit(dataHash3);
        commit(dataHash4);
        commit(dataHash5);
        commit(dataHash6);

        stage = Stages.FirstReveal;
        committed = true;
        orderID = random();
        emit commitEvent(true);
        return true;
    }

    function getOrdernumber() external view restricted returns (uint256) {
        return orderID;
    }

    // function isCommitted() external view restricted returns (bool) {
    //     require(committed == true);
    //     return true;
    // }

    function commit(string memory dataHash) private {
        require(stage == Stages.InitialCommit);

        CommitChoice memory commitChoice = CommitChoice(
            dataHash,
            uint64(block.number),
            false
        );
        commits.push(commitChoice);
    }

    event Reveal(string stepReveal);

    function revealAddress() external payable iscontact(msg.sender) isAgent {
        agentAddr[msg.sender] = false;
        require(
            stage == Stages.FirstReveal ||
                stage == Stages.SecondReveal ||
                stage == Stages.ThirdReveal ||
                stage == Stages.FourthReveal ||
                stage == Stages.FifthReveal ||
                stage == Stages.SixthReveal
        );
        require(commitIndex < commits.length);
        require(commits[commitIndex].revealed == false);
        commits[commitIndex].revealed = true;

        if (stage == Stages.FirstReveal) stage = Stages.SecondReveal;
        else if (stage == Stages.SecondReveal) stage = Stages.ThirdReveal;
        else if (stage == Stages.ThirdReveal) stage = Stages.FourthReveal;
        else if (stage == Stages.FourthReveal) stage = Stages.FifthReveal;
        else if (stage == Stages.FourthReveal) stage = Stages.SixthReveal;
        else if (stage == Stages.SixthReveal) stage = Stages.Delivered;
        emit Reveal(commits[commitIndex++].commitment);
    }

    function random() private view returns (uint256) {
        return
            uint256(
                keccak256(abi.encodePacked(block.difficulty, block.timestamp))
            ) % 10000000000;
    }
}
