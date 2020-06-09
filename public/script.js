let playerIds = [3038538, 2596488, 2596439, 4283112, 4244501, 5053244, 89041];
let playerDataArr=[];
let static;
let currentGW;
let entryPlayers=[];

let testArr=[1,2,3];

(async function(){
    /// måste köras när getPlayers är klar..
 try {
    playerDataArr = await getPlayers();
    currentGW= playerDataArr[0].current_event;
    playerDataArr.sort(function(a, b){
    return (b.summary_overall_points-a.summary_overall_points)
    });  

    printPlayers(playerDataArr);
    _id("loader").classList.toggle("hidden");
    await getStatic();
    printMoreInfo();
   entryPlayers= await getPlayersPerTeam();
    printStats();   

 } catch (error) {
     console.log("Error:" + error.message);
 }

})();


function printMoreInfo(){
    printTransfers();
    printGwTeam(currentGW);
}

function printStats(){
    printMostOwnedPlayers(entryPlayers);
    printMostPointsLeastOwned(entryPlayers);
}

//functions with fetching

function printPlayers(playerDataArr){
    _id("currentGW").innerText="GW"+playerDataArr[0].current_event +" Points";
    let htmlOutput=playerDataArr.map(function(player, index){
      
        return "<tr> <td class'cell1'>"+getLeagueRank(player)+"</td><td class'cell2'>" + player.player_first_name +" " +player.player_last_name +"</td><td class'cell3'>"+ player.summary_overall_rank+"</td> <td class='cell4'>" + player.summary_event_points +"</td> <td class'cell5'>" +player.summary_overall_points + "</td><td class='dropDownCell cell6' onclick='showMore("+index+")'><i id='dropDown"+index+"'class='fas fa-caret-down'></i></td> </tr><tr class='more'><td class='hidden moreTd' id='more"+index+"' colspan='6'><div class='moreDiv' id='moreBox"+index+"'><div id='row1"+index+"' class='row1'></div> <div id='row2"+index+"' class='row2'></div>  </div></td></tr>";
    }) 
  
    document.getElementById("firstRow").insertAdjacentHTML("afterend", htmlOutput.join(""));
}

async function getStatic(){
    try{
        const data = await fetch("https://fplapiisak.herokuapp.com/static");
        static = await data.json();
        static.events.forEach((gw)=>{
            if(gw.is_current==true && gw.finished ==false){
                console.log(gw.finished)
                _id("liveButton").classList.remove("hidden");
                _id("gwNr").innerHTML="GW"+currentGW;
            }
        })
    }
    catch(err){
        console.log(err);
    }
}
function printTransfers(){
    playerDataArr.forEach(async function(player, index){
        try{
            const dataTransfers = await fetch("https://fplapiisak.herokuapp.com/transfers/"+player.id);
            let transfers = await dataTransfers.json();

            const dataHistory=await fetch("https://fplapiisak.herokuapp.com/history/"+player.id);
            let history=await dataHistory.json();

            let wildcardGW=[];
            history.chips.forEach(function(chip){
                if(chip.name=="wildcard"){
                    wildcardGW.push(chip.event);
                }
            })
            let filteredHistory= history.current.filter(function(gw){
                let wcThisGw=false;

                if(wildcardGW.length>0){
                    wildcardGW.forEach(function(chipGw){
                        if(chipGw==gw.event){
                            wcThisGw=true;
                        }
                    })
                }
                return parseFloat(gw.event_transfers) >0 || wcThisGw == true
            });

        

           let historyOutput= filteredHistory.map(function(h, i){
                let wcThisGw=false;
                function getLast(){
                    if(i==0){
                        return "last"
                    }
                    else{
                        return ""
                    }
                }
                   
                    

                if(wildcardGW.length>0){
                    wildcardGW.forEach(function(chipGw){
                        if(chipGw==h.event){
                            wcThisGw=true;
                         }
                    })
                 }

               let gwTransfers= transfers.filter(function(t){
                   return t.event==h.event
               })
               
               let transfersOutput= gwTransfers.map(function(transfer){
                   return "<div class='playerChange'><div class='playerOut' onclick='printMorePlayerInfo("+transfer.element_out+")'> "+getPlayer(transfer.element_out).web_name + "</div> <div class='playerChangeArrow'><i class='fas fa-long-arrow-alt-right'></i></div> <div class='playerIn' onclick='printMorePlayerInfo("+transfer.element_in+")'>" + getPlayer(transfer.element_in).web_name + "</div></div>";
               })
            let costOutput="Free";
            if(h.event_transfers_cost>0){
                costOutput="-"+h.event_transfers_cost+ " points";
            }
            if(wcThisGw) return " <div class='transferBlock "+getLast()+"'><div class='bold transferGw'><h3>GW"+h.event + " - WILDCARD USED</h3></div>" + transfersOutput.join("")+"</div>";  
            else return " <div class='transferBlock "+getLast()+"'><div class='transferGw'><div class='week'> <h3>GW"+h.event + "</h3></div> <div class='middle'><h3><span><i class='fas fa-sync-alt'></span></i></h3></div><div class='transferCost'><h3>"+costOutput+"</h3> </div></div>"+ transfersOutput.join("")+"</div>";  
           })
           if(historyOutput.length>0){
            _id("row2"+index).innerHTML+="<div class='moreHeader'><div class='moreHeaderH2'><h2>Transfers</h2></div><div class='moreHeaderIcon'><i id='showTransfers"+index+"' class='fas fa-caret-up' onclick='showTransfers("+index+")'></i></span></div></div><div id='transferContent"+index+"' class='transferHistory'><div class='moreContent'>"+historyOutput.reverse().join("")+"</div></div>";
           }
           else{
            _id("row2"+index).innerHTML+="<div class='moreHeader'><div class='moreHeaderH2'><h2>Transfers</h2></div><div class='moreHeaderIcon'><i id='showTransfers"+index+"' class='fas fa-caret-up' onclick='showTransfers("+index+")'></i></div></div><div id='transferContent"+index+"'class='transferHistory'><div  class='moreContent'> <h3 class='center'>No transfers made</h3></div></div>";
           }
            
        }
        catch(err){
            console.log(err);
        }
    })   
}

function printGwTeam(gw){
    playerDataArr.forEach(async function(player, index){
        const dataTeams = await fetch("https://fplapiisak.herokuapp.com/gwteam/"+player.id+"/gw/"+currentGW+"/");
        let teams=await dataTeams.json();

        let teamsOutput = teams.picks.map(function(pick, i){
            let multiplier=1;
            let captainIcon="";
            let benchHeader="";
            
            if(i==11){
                benchHeader="<div class='bench'><h3>Bench</h3></div>"
            }
            if(pick.is_captain){
                
               if(i<11) multiplier=2;
                captainIcon=" <span><i class='fas fa-copyright'></i></span> ";
            }
            else if(pick.is_vice_captain){
                captainIcon=" (<span><i class='fas fa-copyright'></i></span>) ";
                if(pick.multiplier==2)multiplier=2;
            }
            playerValues = getPlayer(pick.element);
            return benchHeader+ "<div class='gwPlayer' onclick='printMorePlayerInfo("+playerValues.id+")'> <div class='position'>"+getPosition(playerValues.element_type).singular_name_short + "</div> <div class='playerName'>"+ playerValues.web_name+ captainIcon+"</div> <div class='points'>" + playerValues.event_points *multiplier+ " points</div></div>"
        });


        _id("row1"+index).innerHTML+="<div class='moreHeader'><div class='moreHeaderH2'><h2>Team</h2></div><div class='moreHeaderIcon'><i class='fas fa-caret-up' id='showGwTeam"+index+"' onclick='showGwTeam("+index+")'></i></div></div><div class='gwTeam' id='gwTeam"+index+"'><div id='teamContent"+index+"' class='moreContent'>"+ teamsOutput.join("") +"</div></div>";
    });

}
async function getPlayers(){
 let   playerArr = [];
 
  for(let i in playerIds){
        try{
            const data = await fetch("https://fplapiisak.herokuapp.com/entry/"+playerIds[i]);
            let playerData = await data.json();
            playerArr.push(playerData);
        }
        
        catch(err){
            console.log(err);
            console.log("error getting players",playerIds[i]);
        }

    }
   return playerArr;
     
}
async function getPlayersPerTeam(){
    let playerPerTeamArr=[];
    try{       
       for(let index in playerDataArr){
            const dataTeams = await fetch("https://fplapiisak.herokuapp.com/gwteam/"+playerDataArr[index].id+"/gw/"+currentGW+"/");
            let teams=await dataTeams.json();
    
           teams.picks.forEach(function(pick){
                playerPerTeamArr.push({player: pick.element, captain: pick.is_captain, entry: index});    
            }); 
        };
        return playerPerTeamArr;
    }

    catch{
        console.log("Error");
    }

}
//printing functions
function printMostOwnedPlayers(playerPerTeamArray){
    let playerCount=[];

    playerPerTeamArray.forEach(function(p){
        if(playerCount.length>0){
            let hittad=false;
            playerCount.forEach(function(pc){
                if(pc.player==p.player){
                    pc.count=pc.count+1;
                    hittad=true;
                }
            });
            if(hittad==false){
                playerCount.push({player: p.player, count:1});
            }

        }
        else{
            playerCount.push({player: p.player, count:1});
        }
     
    });
    playerCount.sort(function(a, b){
        return (b.count-a.count)
    }); 
    
    for(let i=0; i<=10; i++){
        playerVal= getPlayer(playerCount[i].player);
        _id("mostOwnedPlayer").innerHTML+="<div class='statPlayer' onclick='printMorePlayerInfo("+playerVal.id+")'><div class='statOwnedBy'>"+playerCount[i].count+"</div><div class='statPlayerName'>"+playerVal.web_name+"</div><div class='statGloballyOwnedBy'>"+playerVal.selected_by_percent+"%</div><div class='statTotalPoints'>"+playerVal.total_points+"</div><div class='statGWPoints'>"+playerVal.event_points+"</div></div>"
    }
}

function printMostPointsLeastOwned(playerPerTeamArray){
    let playerCount=[];

    playerPerTeamArray.forEach(function(p){
        if(playerCount.length>0){
            let hittad=false;
            playerCount.forEach(function(pc){
                if(pc.player==p.player){
                    pc.count=pc.count+1;
                    hittad=true;
                }
            });
            if(hittad==false){
                playerCount.push({player: p.player, count:1});
            }

        }
        else{
            playerCount.push({player: p.player, count:1});
        }
     
    });

    let allPlayerArr=static.elements;

    let notOwnedPlayerArr=[];
    
    allPlayerArr.forEach(function(pl){
        let finns = false;
        playerCount.forEach(function(p){
            if(p.player==pl.id){
                finns=true;
            }
        })
        if(finns==false){
            notOwnedPlayerArr.push({player: pl.id, totalPoints:getPlayer(pl.id).total_points})
        }
    });

    notOwnedPlayerArr.sort(function(a, b){
        return (b.totalPoints-a.totalPoints);
    }); 
    for(let i=0; i<=10; i++){
        playerVal= getPlayer(notOwnedPlayerArr[i].player);
        _id("leastOwned").innerHTML+="<div class='statPlayer' onclick='printMorePlayerInfo("+playerVal.id+")'><div class='statTotalPoints'>"+playerVal.total_points+"</div><div class='statPlayerName'>"+playerVal.web_name+"</div><div class='statGloballyOwnedBy'>"+playerVal.selected_by_percent+"%</div><div class='statCost'>"+playerVal.now_cost/10+"</div><div class='statGWPoints'>"+playerVal.event_points+"</div></div>"
    }

}

async function printMorePlayerInfo(playerId){
    let player = getPlayer(playerId);
    let playerCount=0;
    try{
        entryPlayers.forEach(function(p){
            if(p.player==playerId){
                playerCount++;
            }
     
        });
    }
    catch{
        playerCount="-";
    }
  
    let html = `
    <div id='morePlayerInfo' class='morePlayerInfo'>
        <div class='playerBoxMore'> 
            <div class='morePlayerInfoHeader'>
                <h2>${player.web_name}<span id='removeMorePlayer' class='exitMorePlayer'><i class='far fa-times-circle'></i></span></h2>
            </div>
            <div class='morePlayerContent'>
                <div class='basicPlayerInfo'>
                    <h4>${getTeam(player.team).name}</h4>
                    <h4>${getPosition(player.element_type).singular_name}</h4>
                </div>
                <div class='gamePlayerInfo'>
                    <div class='gamePlayerInfoContent'><h5 class='tooltip' title="Total points">Total</h5>${player.total_points}pts </div>
                    <div class='gamePlayerInfoContent'><h5 class='tooltip' title="Latest GW Points">GW${currentGW}</h5>${player.event_points}pts</div>
                    <div class='gamePlayerInfoContent'><h5 class='tooltip' title="Player cost">Cost</h5>£${player.now_cost/10}</div>
                    <div class='gamePlayerInfoContent'><h5 class='tooltip' title="Globally selected by">GSB</h5>${player.selected_by_percent}%</div>
                    <div class='gamePlayerInfoContent'><h5 class='tooltip' title="Selected by in the league">SB</h5>${Math.round((playerCount/playerIds.length*100) * 10) / 10   }%</div>
             
                </div>
                <h3>Next 5 Fixtures</h3>
                <div class='playerFixtures'></div>
                <h3>Last 5 Matches</h3>
                <div class='playerHistory'></div>
            </div>
        </div>
    </div>
    
    `
    document.getElementById("sideMenuBox").insertAdjacentHTML("afterend", html);
    _id("removeMorePlayer").addEventListener("click", el=>{
        _id("morePlayerInfo").remove();
    });

    try{
        const data = await fetch("https://fplapiisak.herokuapp.com/element-summary/"+playerId);
        let playerData = await data.json();

        let fixtureData=playerData.fixtures;
        let fixtureHtml=[];

        for(let i=0; i<5; i++){
            let opponent;
            let last="";
            if(fixtureData[i].is_home){
                opponent=getTeam(fixtureData[i].team_a).name+" (H)";
            }
            else{
                opponent=getTeam(fixtureData[i].team_h).name+" (A)"; 
            }
            if(i==4)last="last";
            fixtureHtml[i]=`<div class='fixture fixtureDiff${fixtureData[i].difficulty} ${last}'><div class='fixtureOpp'>${opponent}</div> <div class='fixtureGw'>GW${fixtureData[i].event}</div></div>`
        }
        document.getElementsByClassName("playerFixtures")[0].innerHTML=fixtureHtml.join("");

        let historyData=playerData.history;
        historyData.reverse();
        let historyHtml=[];

        for(let i=0; i<5; i++){
            let opponent;
            let result="draw";
            let first="";

            if(historyData[i].was_home){
                opponent=getTeam(historyData[i].opponent_team).name+" (H)";

                if(historyData[i].team_h_score > historyData[i].team_a_score){
                    result="win";
                }
                else if(historyData[i].team_h_score < historyData[i].team_a_score){
                    result="loss";
                }
            }
            else{
                opponent=getTeam(historyData[i].opponent_team).name+" (A)"; 
                if(historyData[i].team_h_score < historyData[i].team_a_score){
                    result="win";
                }
                else if(historyData[i].team_h_score > historyData[i].team_a_score){
                    result="loss";
                }
            }
            
            if(i==0)first="first";
        
            historyHtml[i]=`<div class='historyMatch ${first}'>
                <div class='historyGw ${result}'>GW${historyData[i].round}</div>
                <div class='historyOpp'>${opponent} ${historyData[i].team_h_score}-${historyData[i].team_a_score}</div>
                <div class='historyPts'>${historyData[i].total_points} pts</div>
                <div class='historyMinutes'>${historyData[i].minutes} min</div>
            </div>`
        }
        document.getElementsByClassName("playerHistory")[0].innerHTML=historyHtml.join("");


    }
    
    catch(err){
        console.log(err);
    }


  
}

//getting specific info from fetched data
function getLeagueRank(p){
   let league = p.leagues.classic.filter(l => {
       return l.name=="Perpow";
   });
   let icon;
   let diff=league[0].entry_rank-league[0].entry_last_rank;
   if(diff>0){
        icon="<i class='fas fa-chevron-down'></i> "
   }
   else if(diff<0){
       icon="<i class='fas fa-chevron-up'></i> "
   }
   else{
        icon="<i class='fas fa-circle'></i> "
   }
     return icon+ league[0].entry_rank;

}

function getPlayer(playerId){
    let filteredPlayer=static.elements.filter(function(p){
        return p.id==playerId;
    })

    return filteredPlayer[0]
}

function getTeam(teamId){
    searchedTeam = static.teams.filter(function(el){
        return el.id==teamId;
    })
    return searchedTeam[0]
}

function getPosition(positionId){
    searchedPosition=static.element_types.filter(function(el){
        return el.id==positionId;
    })
    return searchedPosition[0];
}


//toggling elements
function showMore(rowId){
    _id("dropDown"+rowId).classList.toggle("fa-caret-down");
    _id("dropDown"+rowId).classList.toggle("fa-caret-up");
    _id("more"+rowId).classList.toggle("hidden");
}

function showGwTeam(id){
    _id("showGwTeam"+id).classList.toggle("fa-caret-down");
    _id("showGwTeam"+id).classList.toggle("fa-caret-up");
    _id("gwTeam"+id).classList.toggle("hiddenMore");
}

function showTransfers(id){
    _id("showTransfers"+id).classList.toggle("fa-caret-down");
    _id("showTransfers"+id).classList.toggle("fa-caret-up");
    _id("transferContent"+id).classList.toggle("hiddenMore");
}
_id("menuButton").addEventListener("click", el=>{
    _id("sideMenuBox").classList.toggle("moveMenu");
    _id("menuIcon").classList.toggle("rotate");
})
_id("statsLink").addEventListener("click", el=>{
    _id("scoreboard").classList.add("hidden");
    _id("liveGw").classList.add("hidden");
    _id("stats").classList.remove("hidden"); 
});
_id("homeLink").addEventListener("click", el=>{
    _id("scoreboard").classList.remove("hidden");
    _id("liveGw").classList.add("hidden");
    _id("stats").classList.add("hidden");
});
/* _id("liveButton").addEventListener("click", el=>{
    _id("stats").classList.add("hidden");
    _id("scoreboard").classList.add("hidden");
    _id("liveGw").classList.remove("hidden");
}); */







//helper
function _id(id){
    return document.getElementById(id);

}