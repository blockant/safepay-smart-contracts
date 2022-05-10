//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;
pragma abicoder v2;
import "hardhat/console.sol";
import "./Ownable.sol";

contract Escrow is Ownable{
    event JobCreated(uint256 _jobId, address _freelancer, uint256 _payment);

    struct Job{
        address freelancer;
        uint96 payment;
    }

    mapping (uint256 => Job) public job;
    mapping (uint256 => bool) public completion;
    mapping (uint256 => bool) public cancellation;


    modifier checkJobCreator(uint256 _jobId){
        address sender = address(_jobId>>96);
        if(sender != msg.sender) revert("Caller is not owner of job Id");
        _;
    }

    function initializeJob(uint256 _jobId, address _freelancer, uint256 _payment) external payable checkJobCreator(_jobId){
        Job memory _job = Job(_freelancer, uint96(_payment));
        address sender = address(_jobId>>96);
        if(sender != msg.sender) revert("Caller is not owner of job Id");
        if(job[_jobId].freelancer != address(0)) revert("job id exists");
        if(msg.value< _payment) revert("Insufficient Payment");
        job[_jobId] = _job;
        emit JobCreated(_jobId, _freelancer, _payment);
    }

    function transferFee() internal{
        
    }

    function jobComplete(uint256 _jobId) external checkJobCreator(_jobId){
        if(completion[_jobId]) revert ("Job already complete");
        completion[_jobId] = true;
        Job memory _job = job[_jobId];
        (bool success, ) = _job.freelancer.call{value: _job.payment}("");
        require(success, "Unable to send value, recipient may have reverted");
    }

    function jobCancelled(uint256 _jobId) external checkJobCreator(_jobId){
        if(!cancellation[_jobId]) revert("Not cancelled by admin");
        if(completion[_jobId]) revert("Job already complete");
        completion[_jobId] = true;

        (bool success, ) = msg.sender.call{value: job[_jobId].payment}("");
        require(success, "Unable to send value, recipient may have reverted");
    }

    function cancelJobAdmin(uint256 _jobId) external onlyOwner{
        cancellation[_jobId] = true;
    }

}