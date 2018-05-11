function gameTick(simulated=false) {
	var tickTime=new Date().getTime()
	if (player.lastTick>0) {
		sinceLastSave=Math.floor((tickTime-lastSave)/1000)
		if (sinceLastSave>59) {
			saveGame()
		}
		
		if (simulated) var delta=simulatedTickLength
		else var delta=(tickTime-player.lastTick)/1000
		player.playtime+=delta
		
		ableToRankUp=true
		needToUpdate=false
		do {
			var rankReq=rankRequirements[player.rank-1]
			if (rankReq!=undefined) {
				ableToRankUp=true
				for (req in rankReq) {
					if (ableToRankUp) {
						var value=player[req]
						if (typeof(value)=='number') {
							if (player[req]<rankReq[req]) ableToRankUp=false
						} else {
							if (player[req].lt(rankReq[req])) ableToRankUp=false
						}
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
		
		if (totalHPS.gt(0)) {
			player.workers.waitUntilDamage=player.workers.waitUntilDamage.add(totalHPS.times(delta))
			if (player.workers.waitUntilDamage.gte(1)) {
				var totalDamagePerTick=player.workers.waitUntilDamage.floor()
				player.currentStone.hp=player.currentStone.hp.sub(totalDamagePerTick)
				player.workers.waitUntilDamage=player.workers.waitUntilDamage.sub(totalDamagePerTick)
			}
		}
	
		if (player.currentStone.hp.lte(0)) {
			var add=Decimal.pow(1.45,player.depth-1).div(ores[player.currentStone.ore].mult).ceil()
			if (player.currentStone.ore=='Stone') {
				player.stone=player.stone.add(add)
				player.totalStone=player.totalStone.add(add)
			} else {
				player.totalOres=player.totalOres.add(add)
				if (player.ores[player.currentStone.ore]==undefined) player.ores[player.currentStone.ore]=new Decimal(add)
				else player.ores[player.currentStone.ore]=player.ores[player.currentStone.ore].add(add)
				updateCoinGain()
			}
			player.currentStone.ore=generateOre()
			player.currentStone.maxHp=Decimal.pow(2,player.depth-1).times(Math.random()*5+7.5).times(ores[player.currentStone.ore].mult).round()
			player.currentStone.hp=player.currentStone.maxHp
		}
		
		if (player.rank>2) {
			if (player.stone.gte(nextDepthRequirement)) {
				player.maxDepth++
				updateNextDepthRequirement()
			}
		}
	}
	player.lastTick=tickTime
	
	if (simulated) return
	updateElement('rankNumber',player.rank+' '+nextRankText)
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
		updateElement('stoneAmount',format(player.stone))
		updateElement('coins',format(player.coins))
		updateClass('stoneDisplay','ore_'+player.currentStone.ore)
		
		var powerText
		if (pickaxePower.lt(9.95)) {
			powerText=Math.round(pickaxePower.toNumber()*10)/10
		} else {
			powerText=format(pickaxePower)
		}
		if (totalHPS.gt(0)) {
			if (totalHPS.lt(9.95)) {
				powerText=powerText+' ('+Math.round(totalHPS.toNumber()*10)/10+'/s)'
			} else {
				powerText=powerText+' ('+format(totalHPS)+'/s)'
			}
		}
		updateElement('power',powerText)
		
		if (player.rank>1) {
			showElement('frame_upgrades','block')
			showElement('frame_ores','block')
			
			var oreListText=''
			for (ore in ores) {
				if (player.ores[ore]!=undefined) oreListText=oreListText+ore+': '+format(player.ores[ore])+'<br>'
			}
			if (oreListText=='') {
				hideElement('sell')
				updateElement('ores','')
			} else {
				showElement('sell','block')
				updateElement('ores',oreListText)
				if (coinGain.eq(1)) {
					updateElement('sell','Sell ores<br>(+1 coin)')
				} else {
					updateElement('sell','Sell ores<br>(+'+format(coinGain)+' coins)')
				}
			}
			
			for (upgradeNum=1;upgradeNum<=upgradeLimits[player.rank-2];upgradeNum++) {
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
			
			for (rank=3;rank<4;rank++) {
				if (player.rank>=rank) {
					showElement('upgrades_rank'+rank,'block')
				} else {
					hideElement('upgrades_rank'+rank)
				}
			}
		} else {
			hideElement('frame_ores')
			hideElement('frame_upgrades')
		}
		if (player.rank>2) {
			showElement('frame_depth','block')
			
			updateElement('depth',player.depth)
			updateElement('nextDepth',player.maxDepth+1)
			updateElement('nextDepthRequirement',format(nextDepthRequirement))
		} else {
			hideElement('frame_depth')
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
		updateElement('saveGame','Save<br>('+sinceLastSave+'s ago)')
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
			var stored=''
			if (nextRankText!='') stored=nextRankText+' & '
			if (req=='maxDepth') {
				nextRankText=stored+'max depth '+rankRequirements[player.rank-1][req]
			} else {
				nextRankText=stored+format(rankRequirements[player.rank-1][req])+' '+req
			}
		}
		nextRankText='(Next rank requires '+nextRankText+')'
	}
}

function mineStone() {
	player.currentStone.hp=player.currentStone.hp.sub(pickaxePower)
	player.totalDamage=player.totalDamage.add(pickaxePower)
}

function unfocusStone() {
	var key = event.keyCode || event.which;
	if (key==13) {
		document.getElementById('stoneDisplay_button').blur()
		mineStone()
	}
}

function generateOre() {
	if (player.rank==1) {
		return 'Stone'
	} else {
		var random=Math.random()
		if (random>0.5) return 'Stone'
		for (ore in ores) {
			if (random>0.5/ores[ore].mult) {
				if (player.depth>=ores[ore].depth) return ore
			}
		}
		return 'Stone'
	}
}

function updateCoinGain() {
	var coinGainTemp=new Decimal(0)
	for (ore in player.ores) {
		if (ores[ore]!=undefined) coinGainTemp=coinGainTemp.add(player.ores[ore].times(Math.pow(ores[ore].mult,1.2)))
	}
	if (player.upgrades.includes(5)) coinGainTemp=coinGainTemp.times(2)
		
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
		
		if (upgradeNum==1) updateHPS()
		if (upgradeNum==2) updatePickaxePower()
		if (upgradeNum==3) updatePickaxePower()
		if (upgradeNum==4) updatePickaxePower()
		if (upgradeNum==5) updateCoinGain()
	}
}

function updateHPS() {
	totalHPS=new Decimal(0)
	if (player.upgrades.includes(1)) totalHPS=new Decimal(2)
}

function updatePickaxePower() {
	pickaxePower=new Decimal(1)
	if (player.upgrades.includes(2)) pickaxePower=new Decimal(1.5)
	if (player.upgrades.includes(3)) pickaxePower=pickaxePower.times(1.5)
	if (player.upgrades.includes(4)) pickaxePower=pickaxePower.times(1.5)
}

function updateNextDepthRequirement() {
	nextDepthRequirement=Decimal.pow(10,(player.maxDepth-1)*2/3+2)
}

function changeDepth(delta) {
	var oldDepth=player.depth
	player.depth+=delta
	if (player.depth<1) player.depth=1
	else if (player.depth>player.maxDepth) player.depth=player.maxDepth
	
	if (oldDepth!=player.depth) {
		player.currentStone.ore=generateOre()
		player.currentStone.maxHp=Decimal.pow(2,player.depth-1).times(Math.random()*5+7.5).times(ores[player.currentStone.ore].mult).round()
		player.currentStone.hp=player.currentStone.maxHp
	}
}

function switchNotation() {
	player.options.notation++
	if (player.options.notation==notationArray.length) player.options.notation=0
	
	updateNextRankText()
}