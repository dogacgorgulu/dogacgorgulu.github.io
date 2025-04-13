// const socket = io("https://common-verdant-boa.glitch.me/tabletop");
document.addEventListener('DOMContentLoaded', () => {
    const socket = io("https://common-verdant-boa.glitch.me/tabletop");
    const cardContainer = document.getElementById('card-container');
    let draggedCard = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const cardPositions = {};
    document.querySelectorAll('.card').forEach(card => {
        cardPositions[card.dataset.id] = {
            x: card.offsetLeft,
            y: card.offsetTop,
            flipped: false
        };
    });

    socket.on('connect', () => {
        document.getElementById('user-id').textContent = socket.id;
      });

      document.getElementById('set-id').addEventListener('click', () => {
        const customId = document.getElementById('custom-id').value;
        if (customId) {
          socket.emit('setCustomId', customId);
        }
      });

    const updateCardPositions = (id, x, y, flipped) => {
        const card = document.querySelector(`.card[data-id="${id}"]`);
        card.style.left = `${x}px`;
        card.style.top = `${y}px`;
        card.classList.toggle('flipped', flipped);
    };

    socket.on('cardMoved', (data) => {
        updateCardPositions(data.id, data.x, data.y, data.flipped);
    });

    socket.on('cardFlipped', (data) => {
        updateCardPositions(data.id, data.x, data.y, data.flipped);
    });

    cardContainer.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('card')) {
            draggedCard = e.target;
            draggedCard.classList.add('dragging');
            dragOffsetX = e.clientX - draggedCard.getBoundingClientRect().left;
            dragOffsetY = e.clientY - draggedCard.getBoundingClientRect().top;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (draggedCard) {
            e.preventDefault();
            const x = e.clientX - dragOffsetX;
            const y = e.clientY - dragOffsetY;
            draggedCard.style.left = `${x}px`;
            draggedCard.style.top = `${y}px`;
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (draggedCard) {
            draggedCard.classList.remove('dragging');
            socket.emit('moveCard', {
                id: draggedCard.dataset.id,
                x: draggedCard.offsetLeft,
                y: draggedCard.offsetTop,
                flipped: cardPositions[draggedCard.dataset.id].flipped,
                userId: socket.id // Use socket.id as user ID
            });
            draggedCard = null;
        }
    });

    cardContainer.addEventListener('dblclick', (e) => {
        if (e.target.classList.contains('card')) {
            const cardId = e.target.dataset.id;
            cardPositions[cardId].flipped = !cardPositions[cardId].flipped;
            socket.emit('flipCard', {
                id: cardId,
                x: e.target.offsetLeft,
                y: e.target.offsetTop,
                flipped: cardPositions[cardId].flipped,
                userId: socket.id // Use socket.id as user ID
            });
        }
    });
});