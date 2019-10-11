pragma solidity ^0.5.2;

import "./token/ERC20/ERC20.sol";
import "./token/ERC20/ERC20Mintable.sol";
import "./token/ERC20/ERC20Burnable.sol";
import "./EquityToken.sol";

contract AIRContract is ERC20, ERC20Mintable, ERC20Burnable {
	
	/* Contract owner, the company */
	address owner;
	EquityToken company;

	/* Initial shares */
	uint shareSupply;
	
	/* AIR Contract Parameters */
	uint airValuationCapDollar;
	uint airValuationFloorDollar;
	uint airDiscountBasisPoints;
	uint airPurchaseWarrantCapDollar;
	uint airRoundExpirationHeight;

	/* AIR state */
	uint airValuationDollar;
	uint airInvestmentDollar;

	/* Fund raise parameters*/
	uint fundRaisePremoneyValuationDollar;
	uint fundRaiseExpirationHeight;
	uint fundRaiseCapDollar;
	uint investmentFundRaise;

	/* Fund raise state */
	uint fundRaiseInvestmentDollar;

	ERC20Mintable cashToken;
	address[] public airHolders;

	event setUpContract(
		uint valuationFloor,
		uint valuationCap,
		uint airDiscount,
		uint airExpiration,
		uint airDuration,
		uint investmentCap,
		string corpName
		);

	event fundRaise(
		uint premoneyValuation,
		uint cap,
		uint expirationBlock,
		uint fundDuration,
		string corpName
		); 

	event investBSA(
		address investor,
		uint block,
		uint amount, 
		address[] aHolders,
		string corpName
		);

	event investFund(
		address investor,
		uint block,
		uint amount,
		string corpName
		);

	event conversion(
		address investor,
		uint block, 
		uint amount, 
		uint newShares
		);
	
	constructor(EquityToken companyToken, address equity_owner, ERC20Mintable _cashToken) public {
		company = companyToken;
		owner = equity_owner;
		cashToken = _cashToken;
	}

	modifier onlyOwner() {
		require(owner == msg.sender);
	    _;  // f()
	}
	
	/* Set the valuation and company parameters */
	function setupAIR (uint _airValuationCapDollar, uint _airValuationFloorDollar, uint _airDiscountBasisPoints, uint _airRoundDurationBlocks, uint _airPurchaseWarrantCapDollar, string memory corpName) public onlyOwner {
		airRoundExpirationHeight = block.number + _airRoundDurationBlocks;
		airValuationCapDollar = _airValuationCapDollar;
		airValuationFloorDollar = _airValuationFloorDollar;								 
		airDiscountBasisPoints = _airDiscountBasisPoints;
		airPurchaseWarrantCapDollar = _airPurchaseWarrantCapDollar;
		require(airValuationFloorDollar < airValuationCapDollar && airDiscountBasisPoints < 10000);

		/*Paramètres à enregistrer pour event contract*/
		emit setUpContract(airValuationFloorDollar, airValuationCapDollar, airDiscountBasisPoints, airRoundExpirationHeight, _airRoundDurationBlocks, airPurchaseWarrantCapDollar, corpName);
	}

	/* Invest in company in exchange of a purchase warrant (AIR tokens) */
	function invest(uint amount, string memory corpname) public {
		//require(block.number <= airRoundExpirationHeight && airValuationCapDollar > 0); 
		//require(airPurchaseWarrantCapDollar >= (airInvestmentDollar + amount));
		cashToken.transferFrom(msg.sender, address(this), amount);
		_mint(msg.sender, amount);
		airHolders.push(msg.sender);
		airInvestmentDollar += amount; 
		emit investBSA(msg.sender, block.number, amount, airHolders, corpname);
	}

	/* Choose the final pre-money valuation according to the parameters from 'setup' function and current valuation */
	function startFundRaise(uint _fundRaisePremoneyValuationDollar, uint _fundRaiseExpirationHeight, uint _fundRaiseCapDollar, string memory corpName) public onlyOwner {
		//require(block.number >= airRoundExpirationHeight && airInvestmentDollar > 0);
		fundRaiseExpirationHeight = block.number + _fundRaiseExpirationHeight;
		fundRaisePremoneyValuationDollar = _fundRaisePremoneyValuationDollar;
		fundRaiseCapDollar = _fundRaiseCapDollar;

		airValuationDollar = fundRaisePremoneyValuationDollar * (10000 - airDiscountBasisPoints) / 10000;											 
		if(airValuationDollar > airValuationCapDollar) {   										 
			airValuationDollar = airValuationCapDollar;
		}			
		else if(airValuationDollar < airValuationFloorDollar) {
			airValuationDollar = airValuationFloorDollar;
		}
		airRoundExpirationHeight = 0;
		emit fundRaise(airValuationDollar, fundRaiseCapDollar, fundRaiseExpirationHeight, _fundRaiseExpirationHeight, corpName);
	}

	/* Convert AIR tokens into actions tokens for BSA investors */
	function convertNewTokenAction() public {
		//require(block.number > airRoundExpirationHeight && balanceOf(msg.sender)>0 && block.number > fundRaiseExpirationHeight && fundRaiseExpirationHeight > 0);
		uint actionsInvestor = (balanceOf(msg.sender) * company.getInitialShares() ) / (airValuationDollar - company.nominalShareCapital());
		company.mintShares(msg.sender, actionsInvestor);
		_burn(msg.sender, balanceOf(msg.sender));
		emit conversion(msg.sender, block.number, balanceOf(msg.sender), actionsInvestor);
	}
	/* Invest in a fund raise and obtain directly action tokens */
	function investFundRaise(uint amount, string memory corpName) public {
		//require(block.number < fundRaiseExpirationHeight && fundRaiseExpirationHeight > 0);
		cashToken.transferFrom(msg.sender, address(this), amount);
		investmentFundRaise += amount;
		require(investmentFundRaise < fundRaiseCapDollar);
		uint actionsInvestor = (amount * company.getInitialShares() ) / (fundRaisePremoneyValuationDollar - company.nominalShareCapital());
		company.mintShares(msg.sender, actionsInvestor );
		emit investFund(msg.sender, block.number, amount, corpName);
	}

	/*Accessors*/
	function getBSAInvestment() public view returns(uint) {
		return airInvestmentDollar;
	}

	function getFundInvestment() public view returns(uint) {
		return investmentFundRaise;
	}

	function getToken() public view returns(IERC20) {
		return cashToken;
	}

	function getShareRequestConversion(address account) public view returns(uint) {
		return (balanceOf(account) * company.getInitialShares() ) / (airValuationDollar - company.nominalShareCapital());
	}

	function getShareRequestFundRaise(uint nbDAI) public view returns(uint) {
		return (nbDAI * company.getInitialShares() ) / (fundRaisePremoneyValuationDollar - company.nominalShareCapital());
	}
}
