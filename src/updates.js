function gameTick() {
	var tickTime=new Date().getTime()
	if (player.lastTick>0) {
		if (tickTime-lastSave>59999) {
			saveGame()
		}
		
		var delta=(tickTime-player.lastTick)/1000
		player.playtime+=delta
		
		ableToRankUp=true
		needToUpdate=false
		do {
			var rankReq=rankRequirements[player.rank-1]
			if (rankReq!=undefined) {
				ableToRankUp=true
				for (req in rankReq) {
					if (ableToRankUp) {
						if (player[req].lt(rankReq[req])) ableToRankUp=false
					}
				}
			} else {
				ableToRankUp=false
			}
			if (ableToRankUp) {
				player.rank++
				needToUpdate=true
			}
		} while (ableToRankUp)
		if (needToUpdate) updateNextRankText()
		
		if (player.currentStone.hp.lte(0)) {
			if (player.currentStone.ore=='Stone') {
				player.stone=player.stone.add(1)
				player.totalStone=player.totalStone.add(1)
			} else {
				player.totalOres=player.totalOres.add(1)
				if (player.ores[player.currentStone.ore]==undefined) player.ores[player.currentStone.ore]=new Decimal(1)
				else player.ores[player.currentStone.ore]=player.ores[player.currentStone.ore].add(1)
				updateCoinGain()
			}
			player.currentStone.ore=generateOre()
			player.currentStone.maxHp=Decimal.pow(1.2,player.depth).times(Math.random()*5+7.5).times(ores[player.currentStone.ore].mult).round()
			player.currentStone.hp=player.currentStone.maxHp
		}
	}
	player.lastTick=tickTime
	
	updateElement('resources','Stone: '+format(player.stone)+' | Coins: '+format(player.coins)+' | Rank: '+player.rank+'<br>'+nextRankText)
	if (currentTab!=oldTab) {
		hideElement('tab_'+oldTab)
		showElement('tab_'+currentTab,'block')
		oldTab=currentTab
	}
	if (currentTab=='quarry') {
		updateElement('oreName',player.currentStone.ore)
		if (player.currentStone.hp.lt(9.95)) {
			updateElement('hp',Math.round(player.currentStone.hp.toNumber()*10)/10+'/'+format(player.currentStone.maxHp))
		} else {
			updateElement('hp',format(player.currentStone.hp)+'/'+format(player.currentStone.maxHp))
		}
		updateClass('stoneDisplay','ore_'+player.currentStone.ore)
		if (pickaxePower.lt(9.95)) {
			updateElement('power',Math.round(pickaxePower.toNumber()*10)/10)
		} else {
			updateElement('power',format(pickaxePower))
		}
		if (player.rank>1) {
			showElement('frame_upgrades','block')
			
			var oreListText=''
			for (ore in ores) {
				if (player.ores[ore]!=undefined) oreListText=oreListText+ore+': '+format(player.ores[ore])+'<br>'
			}
			if (oreListText=='') {
				hideElement('frame_ores')
			} else {
				showElement('frame_ores','block')
				updateElement('ores',oreListText)
				if (coinGain.eq(1)) {
					updateElement('sell','Sell ores<br>(+1 coin)')
				} else {
					updateElement('sell','Sell ores<br>(+'+format(coinGain)+' coins)')
				}
			}
			
			for (upgradeNum=1;upgradeNum<3;upgradeNum++) {
				var upgId='upg'+upgradeNum
				var upgCost=costs.upgrades[upgradeNum-1]
				updateElement(upgId,'Cost: '+format(upgCost)+' coins')
				if (player.upgrades.includes(upgradeNum)) {
					updateClass(upgId,'upgradeButton bought')
				} else if (player.coins.lt(upgCost)) {
					updateClass(upgId,'upgradeButton cantAfford')
				} else {
					updateClass(upgId,'upgradeButton')
				}
			}
		} else {
			hideElement('frame_ores')
			hideElement('frame_upgrades')
		}
	}
	if (currentTab=='statistics') {
		updateElement('statsPlaytimeValue',formatTime(player.playtime))
		if (player.totalDamage.gt(0)) {
			showElement('statsTotalDamage','table-row')
			updateElement('statsTotalDamageValue',format(player.totalDamage))
		} else {
			hideElement('statsTotalDamage')
		}
		if (player.totalStone.gt(0)) {
			showElement('statsTotalStone','table-row')
			updateElement('statsTotalStoneValue',format(player.totalStone))
		} else {
			hideElement('statsTotalStone')
		}
		if (player.totalOres.gt(0)) {
			showElement('statsTotalOres','table-row')
			updateElement('statsTotalOresValue',format(player.totalOres))
		} else {
			hideElement('statsTotalOres')
		}
		if (player.totalCoins.gt(0)) {
			showElement('statsTotalCoins','table-row')
			updateElement('statsTotalCoinsValue',format(player.totalCoins))
		} else {
			hideElement('statsTotalCoins')
		}
	}
	if (currentTab=='options') {
		updateElement('notationOption','Notation: <br>'+notationArray[player.options.notation])
		if (player.options.updateRate==Number.MAX_VALUE) {
			updateElement('updateRate','Update rate:<br>Unlimited')
		} else {
			updateElement('updateRate','Update rate:<br>'+player.options.updateRate+' TPS')
		}
	}
}

function updateNextRankText() {
	nextRankText=''
	if (rankRequirements[player.rank-1]) {
		for (req in rankRequirements[player.rank-1]) {
			if (nextRankText!='') nextRankText=nextRankText+' & '+format(rankReqs[player.rank-1][req])+' '+req
			nextRankText=nextRankText+format(rankRequirements[player.rank-1][req])+' '+req
		}
		nextRankText='(Next rank requires '+nextRankText+')'
	}
}

function mineStone() {
	player.currentStone.hp=player.currentStone.hp.sub(pickaxePower)
	player.totalDamage=player.totalDamage.add(pickaxePower)
}

function generateOre() {
	if (player.rank==1) {
		return 'Stone'
	} else {
		var random=Math.random()
		for (ore in ores) {
			if (random>0.5/ores[ore].mult) return ore
		}
		return 'Stone'
	}
}

function updateCoinGain() {
	var coinGainTemp=new Decimal(0)
	for (ore in player.ores) {
		if (ores[ore]!=undefined) coinGainTemp=coinGainTemp.add(player.ores[ore].times(ores[ore].mult))
	}
	coinGainTemp=coinGainTemp.floor()
	
	coinGain=coinGainTemp
}

function sell() {
	player.coins=player.coins.add(coinGain)
	player.totalCoins=player.totalCoins.add(coinGain)
	player.ores={}
	updateCoinGain()
}

function buyUpgrade(upgradeNum) {
	if (player.upgrades.includes(upgradeNum)) return
	var upgCost=costs.upgrades[upgradeNum-1]
	if (player.coins.gte(upgCost)) {
		player.coins=player.coins.sub(upgCost)
		player.upgrades.push(upgradeNum)
		
		if (upgradeNum==1) updatePickaxePower()
		if (upgradeNum==2) updatePickaxePower()
	}
}

function updatePickaxePower() {
	pickaxePower=new Decimal(1)
	if (player.upgrades.includes(1)) pickaxePower=new Decimal(1.5)
	if (player.upgrades.includes(2)) pickaxePower=pickaxePower.times(1.5)
}

function switchNotation() {
	player.options.notation++
	if (player.options.notation==notationArray.length) player.options.notation=0
	
	updateNextRankText()
}