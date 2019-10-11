pragma solidity ^0.5.2;

import "./AIRContract.sol";
import "./EquityToken.sol";
import "./token/ERC20/IERC20.sol";

contract ManagerContract {

  event Register(
    string name,
    uint ID,
    address[] shareholders,
    uint[] counts,
    uint idx,
    address airContract,
    address equityContract
    );

  struct Company
  {
    EquityToken shares;
    AIRContract air;
  }

  Company[] registeredCompanies;
  address contractOwner;
  ERC20Mintable cashToken;
  uint idEquity;
  uint idContract;
  
  constructor(ERC20Mintable _cashToken) public{
    contractOwner = msg.sender;
    cashToken = _cashToken;
  }

  function getOwner() public view returns(address) {
   return contractOwner;
 }

 function registerCompany(uint _registrationID, string memory _corporateName, address[] memory shareHolders, uint[] memory shareCounts) public {
    EquityToken e = new EquityToken(_registrationID, _corporateName, shareHolders, shareCounts, msg.sender);
    //require (e.isOwner()==true && e.owner()!=address(0));
    AIRContract c = new AIRContract(e, msg.sender, cashToken);
    Company memory comp = Company(e,c);
    registeredCompanies.push(comp);
    idEquity++;
    emit Register(_corporateName, _registrationID, shareHolders, shareCounts, idEquity -1, address(c), address(e));
  }

  function getDAI(uint amount) public {
    cashToken.mint(msg.sender, amount);
  }

  function getToken() public view returns(ERC20Mintable) {
    return cashToken;
  }
}
