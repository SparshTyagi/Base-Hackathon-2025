// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SwearJar is ReentrancyGuard, Pausable, Ownable {
    // State variables
    mapping(address => uint256) public bonds;
    uint256 public potBalance;
    mapping(address => uint256) public nonces;
    
    // Events
    event BondDeposited(address indexed user, uint256 amount);
    event BondWithdrawn(address indexed user, uint256 amount);
    event PotWithdrawn(address indexed recipient, uint256 amount);
    event ViolationPenalty(address indexed user, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
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
}
