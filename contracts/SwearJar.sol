// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SwearJar is ReentrancyGuard, Pausable, Ownable {
    // Group data structure
    struct Group {
        bytes32 id;
        string name;
        address creator;
        uint256 targetAmount;
        uint256 potBalance;
        uint256 memberCount;
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt;
    }
    
    // Member data structure
    struct Member {
        address wallet;
        uint256 bondAmount;
        bool isActive;
        uint256 joinedAt;
    }
    
    // State variables
    mapping(address => uint256) public bonds; // Legacy single-user bonds
    uint256 public potBalance; // Legacy single pot
    mapping(address => uint256) public nonces;
    
    // Group-specific mappings
    mapping(bytes32 => Group) public groups;
    mapping(bytes32 => mapping(address => Member)) public groupMembers;
    mapping(bytes32 => address[]) public groupMemberList;
    mapping(bytes32 => uint256) public groupPots;
    mapping(bytes32 => mapping(address => uint256)) public groupBonds;
    mapping(bytes32 => mapping(address => uint256)) public groupNonces;
    
    // Group management
    bytes32[] public groupIds;
    mapping(address => bytes32[]) public userGroups;
    
    // Events
    event BondDeposited(address indexed user, uint256 amount);
    event BondWithdrawn(address indexed user, uint256 amount);
    event PotWithdrawn(address indexed recipient, uint256 amount);
    event ViolationPenalty(address indexed user, uint256 amount);
    
    // Group-specific events
    event GroupCreated(bytes32 indexed groupId, address indexed creator, string name, uint256 targetAmount);
    event MemberJoined(bytes32 indexed groupId, address indexed member, uint256 bondAmount);
    event MemberLeft(bytes32 indexed groupId, address indexed member);
    event GroupBondDeposited(bytes32 indexed groupId, address indexed member, uint256 amount);
    event GroupBondWithdrawn(bytes32 indexed groupId, address indexed member, uint256 amount);
    event GroupPenaltyApplied(bytes32 indexed groupId, address indexed member, uint256 amount);
    event GroupPotWithdrawn(bytes32 indexed groupId, address indexed recipient, uint256 amount);
    event GroupDeactivated(bytes32 indexed groupId);
    
    constructor() Ownable(msg.sender) {}
    
    // ============ GROUP MANAGEMENT FUNCTIONS ============
    
    // Create a new group
    function createGroup(
        string memory name,
        uint256 targetAmount,
        uint256 durationDays
    ) external whenNotPaused returns (bytes32) {
        require(bytes(name).length > 0, "Group name cannot be empty");
        require(targetAmount > 0, "Target amount must be greater than 0");
        require(durationDays > 0, "Duration must be greater than 0");
        
        bytes32 groupId = keccak256(abi.encodePacked(
            msg.sender,
            name,
            targetAmount,
            block.timestamp,
            block.number
        ));
        
        require(groups[groupId].id == bytes32(0), "Group already exists");
        
        uint256 expiresAt = block.timestamp + (durationDays * 1 days);
        
        groups[groupId] = Group({
            id: groupId,
            name: name,
            creator: msg.sender,
            targetAmount: targetAmount,
            potBalance: 0,
            memberCount: 0,
            isActive: true,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });
        
        groupIds.push(groupId);
        userGroups[msg.sender].push(groupId);
        
        // Creator automatically joins the group
        _addMemberToGroup(groupId, msg.sender, 0);
        
        emit GroupCreated(groupId, msg.sender, name, targetAmount);
        return groupId;
    }
    
    // Add member to group (internal function)
    function _addMemberToGroup(bytes32 groupId, address member, uint256 bondAmount) internal {
        require(groups[groupId].isActive, "Group is not active");
        require(groupMembers[groupId][member].wallet == address(0), "Member already in group");
        
        groupMembers[groupId][member] = Member({
            wallet: member,
            bondAmount: bondAmount,
            isActive: true,
            joinedAt: block.timestamp
        });
        
        groupMemberList[groupId].push(member);
        groups[groupId].memberCount++;
        userGroups[member].push(groupId);
        
        emit MemberJoined(groupId, member, bondAmount);
    }
    
    // Join group with bond deposit
    function joinGroup(bytes32 groupId) external payable nonReentrant whenNotPaused {
        require(groups[groupId].isActive, "Group is not active");
        require(block.timestamp < groups[groupId].expiresAt, "Group has expired");
        require(msg.value > 0, "Bond amount must be greater than 0");
        require(groupMembers[groupId][msg.sender].wallet == address(0), "Already a member");
        
        _addMemberToGroup(groupId, msg.sender, msg.value);
        groupBonds[groupId][msg.sender] = msg.value;
        groupNonces[groupId][msg.sender] = 1;
        
        emit GroupBondDeposited(groupId, msg.sender, msg.value);
    }
    
    // Leave group and withdraw bond
    function leaveGroup(bytes32 groupId) external nonReentrant whenNotPaused {
        require(groupMembers[groupId][msg.sender].isActive, "Not a member or inactive");
        require(groups[groupId].isActive, "Group is not active");
        
        uint256 bondAmount = groupBonds[groupId][msg.sender];
        require(bondAmount > 0, "No bond to withdraw");
        
        // Remove from group
        groupMembers[groupId][msg.sender].isActive = false;
        groupBonds[groupId][msg.sender] = 0;
        groups[groupId].memberCount--;
        
        // Remove from member list
        address[] storage members = groupMemberList[groupId];
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == msg.sender) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }
        
        // Transfer bond back to user
        (bool success, ) = payable(msg.sender).call{value: bondAmount}("");
        require(success, "Transfer failed");
        
        emit MemberLeft(groupId, msg.sender);
        emit GroupBondWithdrawn(groupId, msg.sender, bondAmount);
    }
    
    // Deactivate group (only creator or owner)
    function deactivateGroup(bytes32 groupId) external {
        require(
            groups[groupId].creator == msg.sender || msg.sender == owner(),
            "Only creator or owner can deactivate"
        );
        require(groups[groupId].isActive, "Group already inactive");
        
        groups[groupId].isActive = false;
        emit GroupDeactivated(groupId);
    }
    
    // ============ LEGACY FUNCTIONS (for backward compatibility) ============
    
    // Deposit bond (payable function)
    function depositBond() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be greater than 0");
        
        bonds[msg.sender] += msg.value;
        nonces[msg.sender]++;
        
        emit BondDeposited(msg.sender, msg.value);
    }
    
    // Withdraw bond
    function withdrawBond(uint256 amount) external nonReentrant whenNotPaused {
        require(bonds[msg.sender] >= amount, "Insufficient bond balance");
        require(amount > 0, "Amount must be greater than 0");
        
        bonds[msg.sender] -= amount;
        nonces[msg.sender]++;
        
        // Transfer ETH back to user
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit BondWithdrawn(msg.sender, amount);
    }
    
    // Apply penalty (only owner can call)
    function applyPenalty(address user, uint256 amount) external onlyOwner {
        require(bonds[user] >= amount, "Insufficient bond balance");
        require(amount > 0, "Amount must be greater than 0");
        
        bonds[user] -= amount;
        potBalance += amount;
        nonces[user]++;
        
        emit ViolationPenalty(user, amount);
    }
    
    // Withdraw from pot (only owner can call)
    function withdrawPot(address payable to, uint256 amount) external onlyOwner {
        require(potBalance >= amount, "Insufficient pot balance");
        require(amount > 0, "Amount must be greater than 0");
        
        potBalance -= amount;
        
        // Transfer ETH to recipient
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit PotWithdrawn(to, amount);
    }
    
    // Emergency pause function
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Get user's bond balance
    function getBond(address user) external view returns (uint256) {
        return bonds[user];
    }
    
    // Get pot balance
    function getPotBalance() external view returns (uint256) {
        return potBalance;
    }
    
    // Get user's nonce
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
    
    // Receive function to accept ETH
    receive() external payable {
        // ETH sent directly to contract goes to pot
        potBalance += msg.value;
    }
    
    // ============ GROUP-SPECIFIC BOND FUNCTIONS ============
    
    // Deposit additional bond to a group
    function depositBondToGroup(bytes32 groupId) external payable nonReentrant whenNotPaused {
        require(groups[groupId].isActive, "Group is not active");
        require(groupMembers[groupId][msg.sender].isActive, "Not a member");
        require(msg.value > 0, "Amount must be greater than 0");
        
        groupBonds[groupId][msg.sender] += msg.value;
        groupNonces[groupId][msg.sender]++;
        
        emit GroupBondDeposited(groupId, msg.sender, msg.value);
    }
    
    // Withdraw bond from a group
    function withdrawBondFromGroup(bytes32 groupId, uint256 amount) external nonReentrant whenNotPaused {
        require(groups[groupId].isActive, "Group is not active");
        require(groupMembers[groupId][msg.sender].isActive, "Not a member");
        require(groupBonds[groupId][msg.sender] >= amount, "Insufficient bond balance");
        require(amount > 0, "Amount must be greater than 0");
        
        groupBonds[groupId][msg.sender] -= amount;
        groupNonces[groupId][msg.sender]++;
        
        // Transfer ETH back to user
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit GroupBondWithdrawn(groupId, msg.sender, amount);
    }
    
    // ============ GROUP-SPECIFIC PENALTY AND POT FUNCTIONS ============
    
    // Apply penalty to a group member (only owner can call)
    function applyPenaltyToGroup(bytes32 groupId, address user, uint256 amount) external onlyOwner {
        require(groups[groupId].isActive, "Group is not active");
        require(groupMembers[groupId][user].isActive, "User not a member");
        require(groupBonds[groupId][user] >= amount, "Insufficient bond balance");
        require(amount > 0, "Amount must be greater than 0");
        
        groupBonds[groupId][user] -= amount;
        groupPots[groupId] += amount;
        groups[groupId].potBalance += amount;
        groupNonces[groupId][user]++;
        
        emit GroupPenaltyApplied(groupId, user, amount);
    }
    
    // Withdraw from group pot (only owner can call)
    function withdrawGroupPot(bytes32 groupId, address payable to, uint256 amount) external onlyOwner {
        require(groups[groupId].isActive, "Group is not active");
        require(groupPots[groupId] >= amount, "Insufficient pot balance");
        require(amount > 0, "Amount must be greater than 0");
        
        groupPots[groupId] -= amount;
        groups[groupId].potBalance -= amount;
        
        // Transfer ETH to recipient
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit GroupPotWithdrawn(groupId, to, amount);
    }
    
    // Distribute group pot to all members (only owner can call)
    function distributeGroupPot(bytes32 groupId) external onlyOwner {
        require(groups[groupId].isActive, "Group is not active");
        require(groupPots[groupId] > 0, "No pot to distribute");
        
        address[] memory members = groupMemberList[groupId];
        uint256 totalMembers = 0;
        
        // Count active members
        for (uint256 i = 0; i < members.length; i++) {
            if (groupMembers[groupId][members[i]].isActive) {
                totalMembers++;
            }
        }
        
        require(totalMembers > 0, "No active members");
        
        uint256 amountPerMember = groupPots[groupId] / totalMembers;
        uint256 distributed = 0;
        
        // Distribute to active members
        for (uint256 i = 0; i < members.length; i++) {
            if (groupMembers[groupId][members[i]].isActive) {
                (bool success, ) = payable(members[i]).call{value: amountPerMember}("");
                if (success) {
                    distributed += amountPerMember;
                }
            }
        }
        
        groupPots[groupId] -= distributed;
        groups[groupId].potBalance -= distributed;
        
        emit GroupPotWithdrawn(groupId, address(0), distributed);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    // Get group information
    function getGroup(bytes32 groupId) external view returns (Group memory) {
        return groups[groupId];
    }
    
    // Get group member information
    function getGroupMember(bytes32 groupId, address member) external view returns (Member memory) {
        return groupMembers[groupId][member];
    }
    
    // Get group pot balance
    function getGroupPotBalance(bytes32 groupId) external view returns (uint256) {
        return groupPots[groupId];
    }
    
    // Get member's bond in group
    function getGroupBond(bytes32 groupId, address member) external view returns (uint256) {
        return groupBonds[groupId][member];
    }
    
    // Get group member list
    function getGroupMembers(bytes32 groupId) external view returns (address[] memory) {
        return groupMemberList[groupId];
    }
    
    // Get user's groups
    function getUserGroups(address user) external view returns (bytes32[] memory) {
        return userGroups[user];
    }
    
    // Get all group IDs
    function getAllGroupIds() external view returns (bytes32[] memory) {
        return groupIds;
    }
    
    // Check if user is member of group
    function isGroupMember(bytes32 groupId, address user) external view returns (bool) {
        return groupMembers[groupId][user].isActive;
    }
    
    // Get group member count
    function getGroupMemberCount(bytes32 groupId) external view returns (uint256) {
        return groups[groupId].memberCount;
    }
    
    // Check if group has reached target
    function hasGroupReachedTarget(bytes32 groupId) external view returns (bool) {
        return groupPots[groupId] >= groups[groupId].targetAmount;
    }
    
    // Get group progress percentage
    function getGroupProgress(bytes32 groupId) external view returns (uint256) {
        if (groups[groupId].targetAmount == 0) return 0;
        return (groupPots[groupId] * 100) / groups[groupId].targetAmount;
    }
}
