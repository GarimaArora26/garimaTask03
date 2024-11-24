sap.ui.define([], function() {
    "use strict";
    return {
        calculateTotalValue: function(stock, price) {
            if (stock && price) {
                return (stock * price).toFixed(2);
            }
            return "N/A";
        }
    };
});