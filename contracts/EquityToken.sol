pragma solidity ^0.5.2;

import "./token/ERC20/ERC20Mintable.sol";
import "./token/ERC20/ERC20Burnable.sol";
import "./ownership/Ownable.sol";

contract EquityToken is ERC20Mintable, ERC20Burnable, Ownable {

    event registerEq(
        address[] holders,
        string corpName
        );

    uint registrationID; // Immatriculation au RCS
    string corporateName;  // Dénomination ou raison sociale
    
    uint256 _nominalShareCapital; // Capital social
    uint256 shareSupply;
    uint256 initialShares;
    address[] public shareHolders;
    address public contract_owner;

    constructor(uint _registrationID, string memory _corporateName, address[] memory _shareHolders, uint[] memory shareCounts, address equity_owner) public {

    	registrationID = _registrationID;
    	corporateName = _corporateName;

    	for(uint i = 0; i < _shareHolders.length ; i++) {
            initialShares += shareCounts[i];
    		mintShares(_shareHolders[i], shareCounts[i]);
    	}

    	contract_owner = equity_owner;
    	addMinter(contract_owner);
        emit registerEq(_shareHolders, _corporateName);
    }

    function mintShares(address account, uint256 value) public {
    	if (value > 0 && balanceOf(account) == 0) {
    		shareHolders.push(account);
    		shareSupply += value;
    	}
    	super.mint(account, value);    	
    }

    function getInitialShares() public view returns(uint256) {
        return initialShares;
    }

    function burnShares(address account, uint256 value) public {
    	if (value > 0 && balanceOf(account) == value ) {
    		shareSupply -= value;
    		for(uint ix = 0; ix < shareHolders.length; ix++) {
    			if(shareHolders[ix] == account) {
    				shareHolders[ix] = shareHolders[shareHolders.length - 1];
    				shareHolders.length --;
    			}
    		}
    	}
    	super.burnFrom(account, value); 
    }

    function addMinterContract(address Air) public {
    	addMinter(Air);
    }

    function getCorporateName() public view returns (string memory) {
    	return corporateName;
    }

    function getOwner() public view returns (address) {
    	return contract_owner;
    }

    function getShareSupply() public view returns (uint256) {
    	return shareSupply;
    }

    function getShareHolders() public view returns (address[] memory) {
    	return shareHolders;
    }

    function nominalShareCapital() public view returns (uint256) {
    	return _nominalShareCapital;
    }

}
