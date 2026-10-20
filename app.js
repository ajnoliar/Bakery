document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. SPA CLIENT-SIDE ROUTING ACTION MAPPING ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const pageViews = document.querySelectorAll('.page-view');

    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const targetPageId = button.getAttribute('data-target');
            pageViews.forEach(view => {
                if (view.id === targetPageId) {
                    view.classList.add('active');
                } else {
                    view.classList.remove('active');
                }
            });

            if (targetPageId === 'admin-page') {
                renderAdminQueueTable();
            }
        });
    });

    // --- 2. MULTI-ITEM PRE-ORDER SUBMISSION FORM REGISTRY ---
    const preorderForm = document.getElementById('preorder-form');

    preorderForm.addEventListener('submit', (e) => {
        e.preventDefault(); 

        // Extract Customer info details
        const customerName = document.getElementById('customer-name').value;
        const customerPhone = document.getElementById('customer-phone').value;
        const pickupTime = document.getElementById('pickup-time').value;

        // Loop over menu grid container and collect selected item bundles
        const selectedItems = [];
        const menuCards = document.querySelectorAll('.menu-item-card');
        
        menuCards.forEach(card => {
            const itemName = card.getAttribute('data-item-name');
            const qtyInput = card.querySelector('.item-qty');
            const qtyValue = parseInt(qtyInput.value, 10);

            // Add item compilation string only if quantity input threshold is greater than 0
            if (qtyValue > 0) {
                selectedItems.push(`${itemName} (x${qtyValue})`);
            }
        });

        // Validation Rule block: Customer must check/select at least 1 item before processing order
        if (selectedItems.length === 0) {
            alert('Please select a quantity for at least one bread in the menu above before submitting.');
            return;
        }

        // Structure a uniform customer storage data entry object packet
        const newPreorder = {
            name: customerName,
            phone: customerPhone,
            time: formatTimeDisplay(pickupTime),
            items: selectedItems.join(', '), // Merge items cleanly with a comma separation spacer
            status: 'Pending'
        };

        // Commit configuration tracking to localStorage
        let currentOrdersList = [];
        try {
            currentOrdersList = JSON.parse(localStorage.getItem('lopez_bakery_orders')) || [];
        } catch(error) {
            console.error("Storage buffer initialization failure:", error);
        }

        currentOrdersList.push(newPreorder);
        localStorage.setItem('lopez_bakery_orders', JSON.stringify(currentOrdersList));

        alert('Order submitted successfully!');
        
        // Reset full form and zero-out menu quantity states cleanly
        preorderForm.reset();
        document.querySelectorAll('.item-qty').forEach(input => input.value = "0");
    });

    renderAdminQueueTable();
});

// --- 3. DYNAMIC TABLE CELL CONTENT RENDER MAPPING CORE ---
function renderAdminQueueTable() {
    const queueBody = document.getElementById('orders-queue-body');
    if (!queueBody) return;

    queueBody.innerHTML = '';

    let storedOrders = [];
    try {
        storedOrders = JSON.parse(localStorage.getItem('lopez_bakery_orders')) || [];
    } catch(e) {
        console.error("Parsing failure on bakery registry lines:", e);
    }

    if (storedOrders.length === 0) {
        queueBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-orders-msg">No active pre-orders in queue.</td>
            </tr>
        `;
        return;
    }

    storedOrders.forEach((order, index) => {
        const row = document.createElement('tr');
        const badgeClass = order.status === 'Ready' ? 'status-ready' : 'status-pending';

        row.innerHTML = `
            <td><strong>${order.time}</strong></td>
            <td>
                <div><strong>${order.name}</strong></div>
                <div style="font-size: 13px; color: #666;">${order.phone}</div>
            </td>
            <td>${order.items}</td>
            <td><span class="status-badge ${badgeClass}">${order.status}</span></td>
            <td>
                ${order.status === 'Pending' 
                    ? `<button class="action-btn" onclick="toggleOrderReadyState(\\${index})">Mark Ready</button>` 
                    : `<span style="font-size: 13px; color: #888; font-weight: 600;">✓ Completed</span>`
                }
            </td>
        `;
        queueBody.appendChild(row);
    });
}

// --- 4. DATA SYNCHRONIZATION MUTATION CONTROLLER ---
window.toggleOrderReadyState = function(index) {
    let currentOrders = JSON.parse(localStorage.getItem('lopez_bakery_orders')) || [];
    
    if (currentOrders[index]) {
        currentOrders[index].status = 'Ready';
        localStorage.setItem('lopez_bakery_orders', JSON.stringify(currentOrders));
        renderAdminQueueTable(); 
    }
};

// Helper utility to format raw input time sets to clean displays
function formatTimeDisplay(timeString) {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    let hourNum = parseInt(hours, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    hourNum = hourNum % 12;
    hourNum = hourNum ? hourNum : 12; 
    return `${String(hourNum).padStart(2, '0')}:${minutes} ${ampm}`;
}