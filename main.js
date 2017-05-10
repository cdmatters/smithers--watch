"use strict";
var $container = document.getElementById('container')

var deck = Deck()
deck.mount($container)

function jsonToCard(smithers_card)
{ 
    var index = 0
    var card = smithers_card.split("")
    switch (card[0])
    {
    case "A":
        index = 0
        break
    case "J":
        index = 10
        break
    case "Q":
        index = 11 
        break
    case "K":        
        index = 12
        break
    default:
        index = parseInt(card[0]) - 1     
    }

    switch (card[1])
    {
    case "s":
        index += (13 * 0)
        break
    case "h":
        index += (13 * 1)
        break
    case "d":
        index += (13 * 2)
        break
    case "c": 
        index += (13 * 3)
        break
    }
    console.log(index, smithers_card)
    console.log(deck.cards[index])
    return deck.cards[index]
}

function displayFile()
{
    // load the JSON 
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() 
    {
        if (this.readyState == 4 && this.status == 200) 
        {
             process_file(JSON.parse(xhttp.response));
        }
    };
    xhttp.open("GET", "./tournaments.json", true);
    xhttp.send(); 
}

function get_nsided_polygon_vertices(n, x_centre, y_centre, radius)
{ 
    let vertices = []
    let angle = 0
    let angle_increment =  Math.PI / (n - 1)
    for (let i = 0; i < n; i++)
    {
        vertices.push({
            x: x_centre + radius * Math.cos(angle),
            y: y_centre + radius * Math.sin(angle),
        })
        angle += angle_increment
    }
    return vertices
}

function move_cards_to_coord(cards, coord)
{
    cards.forEach(function (c, i) {
        var card = jsonToCard(c)
        console.log(card)
        var card_sep = 30
        card.setSide('front')
        card.animateTo({
            delay: 500 + i * 2, // wait 1 second + i * 2 ms
            duration: 500,
            ease: 'quartOut',
    
            x: coord.x + card_sep * i,
            y: coord.y + card_sep * i
        })
    })

}

function deal_hands(message)
{
    // var coords = get_seat_coordinates(message.playerslength)
    var coords = get_nsided_polygon_vertices(message.players.length, 0, 0, (window.innerHeight - 200)/2 )
    console.log(coords)
    for (var i = 0; i < message.players.length; i++)
    {
        let hand_string =  message.players[i].hand.split("|")
        let cards = hand_string[1].split(" ")
        let dealer = hand_string[2]
        console.log(cards)
        move_cards_to_coord(cards, coords[i])


    }
}

function process_file(json_tournament)
{
    var seat_locations = {}

    console.log(json_tournament)
    for (var i = 0; i < json_tournament.length; i++)
    {
        let item = json_tournament[i]
        console.log(item.type)
        switch (item.type)
        {
        case "DEALT_HANDS":
            deal_hands(item)
            return; 
        }
    }


    
}

displayFile()




// deck.cards.forEach(function (card, i) {
//     card.setSide('front')

//     // explode
//     card.animateTo({
//         delay: 1000 + i * 2, // wait 1 second + i * 2 ms
//         duration: 500,
//         ease: 'quartOut',

//         x: Math.random() * window.innerWidth - window.innerWidth / 2,
//         y: Math.random() * window.innerHeight - window.innerHeight / 2
//     })
// })

