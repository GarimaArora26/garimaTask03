sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Input",
    "./formatter"
], function (Controller, JSONModel, MessageBox, Dialog, Button, Label, Input, formatter) {
    "use strict";

    return Controller.extend("books.books.controller.View1", {
        formatter: formatter,
        onInit: function () {
            var oViewModel = new JSONModel({
                selectedIndex: -1,
                grandTotal: 0
            });
            this.getView().setModel(oViewModel, "viewModel");

            // Attach to the view's modelContextChange event
            this.getView().attachModelContextChange(this.onModelContextChange, this);

            // Initialize the table binding
            this.initializeTableBinding();
        },

        onModelContextChange: function() {
            // Re-initialize the table binding when the model context changes
            this.initializeTableBinding();
        },

        initializeTableBinding: function() {
            var oTable = this.byId("booksTable");
            if (oTable) {
                oTable.attachEventOnce("updateFinished", this.onTableUpdateFinished, this);
            } else {
                console.error("Table with id 'booksTable' not found");
            }
        },

        onTableUpdateFinished: function(oEvent) {
            var oTable = oEvent.getSource();
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.attachDataReceived(this.calculateGrandTotal, this);
                oTable.attachSelectionChange(this.onSelectionChange, this);
                this.calculateGrandTotal();
            } else {
                console.warn("Table binding not available");
            }
        },

        onSelectionChange: function (oEvent) {
            var oViewModel = this.getView().getModel("viewModel");
            var iSelectedIndex = oEvent.getSource().getSelectedIndex();
            oViewModel.setProperty("/selectedIndex", iSelectedIndex);
        },

        calculateGrandTotal: function() {
            var aItems = this.byId("booksTable").getItems();
            var fGrandTotal = aItems.reduce(function(fTotal, oItem) {
                var oContext = oItem.getBindingContext();
                if (oContext) {
                    return fTotal + (oContext.getProperty("stock") * oContext.getProperty("price"));
                }
                return fTotal;
            }, 0);

            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/grandTotal", fGrandTotal.toFixed(2));
        },

        onOpenAddDialog: function () {
            if (!this._oAddDialog) {
                this._oAddDialog = new Dialog({
                    title: "Add New Book",
                    content: [
                        new Label({ text: "ID" }),
                        new Input({ id: "idInput" }),
                        new Label({ text: "Title" }),
                        new Input({ id: "titleInput" }),
                        new Label({ text: "Stock" }),
                        new Input({ id: "stockInput", type: "Number" }),
                        new Label({ text: "Price" }),
                        new Input({ id: "priceInput", type: "Number" })
                    ],
                    beginButton: new Button({
                        text: "Add",
                        press: function () {
                            var sId = sap.ui.getCore().byId("idInput").getValue();
                            var sTitle = sap.ui.getCore().byId("titleInput").getValue();
                            var iStock = parseInt(sap.ui.getCore().byId("stockInput").getValue());
                            var fPrice = parseFloat(sap.ui.getCore().byId("priceInput").getValue());
                            this.createBook(sId, sTitle, iStock, fPrice);
                            this._oAddDialog.close();
                        }.bind(this)
                    }),
                    endButton: new Button({
                        text: "Cancel",
                        press: function () {
                            this._oAddDialog.close();
                        }.bind(this)
                    })
                });
            }
            sap.ui.getCore().byId("idInput").setValue("");
            sap.ui.getCore().byId("titleInput").setValue("");
            sap.ui.getCore().byId("stockInput").setValue("");
            sap.ui.getCore().byId("priceInput").setValue("");
            this._oAddDialog.open();
        },
        
        createBook: function (sId, sTitle, iStock, fPrice) {
            var oModel = this.getView().getModel();
            if (!oModel) {
                console.error("OData model not available");
                MessageBox.error("Unable to add book: OData model not available");
                return;
            }

            var oNewBook = {
                ID: sId,
                title: sTitle,
                stock: iStock,
                price: fPrice
            };

            console.log("Attempting to create book:", oNewBook);

            var oListBinding = this.byId("booksTable").getBinding("items");
            
            if (oListBinding) {
                oListBinding.create(oNewBook, true /*bAtEnd*/, {
                    groupId: "$auto"
                }).created()
                .then(function(oCreatedContext) {
                    console.log("Book created successfully:", oCreatedContext.getObject());
                    MessageBox.success("Book added successfully");
                    this.calculateGrandTotal();
                }.bind(this))
                .catch(function(oError) {
                    console.error("Error creating book:", oError);
                    MessageBox.error("Error adding book: " + (oError.message || "Unknown error"));
                });
            } else {
                console.error("List binding not available");
                MessageBox.error("Unable to add book: List binding not available");
            }
        },

        onOpenEditDialog: function () {
            var oTable = this.byId("booksTable");
            var oSelectedItem = oTable.getSelectedItem();
            if (oSelectedItem) {
                var oBook = oSelectedItem.getBindingContext().getObject();
                if (!this._oEditDialog) {
                    this._oEditDialog = new Dialog({
                        title: "Edit Book",
                        content: [
                            new Label({ text: "Title" }),
                            new Input({ id: "editTitleInput", value: oBook.title }),
                            new Label({ text: "Stock" }),
                            new Input({ id: "editStockInput", type: "Number", value: oBook.stock }),
                            new Label({ text: "Price" }),
                            new Input({ id: "editPriceInput", type: "Number", value: oBook.price })
                        ],
                        beginButton: new Button({
                            text: "Save",
                            press: function () {
                                var sTitle = sap.ui.getCore().byId("editTitleInput").getValue();
                                var iStock = parseInt(sap.ui.getCore().byId("editStockInput").getValue());
                                var fPrice = parseFloat(sap.ui.getCore().byId("editPriceInput").getValue());
                                this.updateBook(oBook.ID, sTitle, iStock, fPrice);
                                this._oEditDialog.close();
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: "Cancel",
                            press: function () {
                                this._oEditDialog.close();
                            }.bind(this)
                        })
                    });
                } else {
                    sap.ui.getCore().byId("editTitleInput").setValue(oBook.title);
                    sap.ui.getCore().byId("editStockInput").setValue(oBook.stock);
                    sap.ui.getCore().byId("editPriceInput").setValue(oBook.price);
                }
                this._oEditDialog.open();
            } else {
                MessageBox.warning("Please select a book to edit.");
            }
        },

        updateBook: function (sID, sTitle, iStock, fPrice) {
            var oModel = this.getView().getModel();
            var oContext = this.byId("booksTable").getSelectedItem().getBindingContext();

            if (oContext) {
                oContext.setProperty("title", sTitle);
                oContext.setProperty("stock", iStock);
                oContext.setProperty("price", fPrice);

                oModel.submitChanges({
                    groupId: "booksGroup"
                }).then(function() {
                    MessageBox.success("Book updated successfully");
                    this.calculateGrandTotal();
                }.bind(this)).catch(function(oError) {
                    MessageBox.error("Error updating book: " + oError.message);
                });
            } else {
                MessageBox.error("Unable to update book: No context available");
            }
        },

        onDeleteBook: function () {
            var oTable = this.byId("booksTable");
            var oSelectedItem = oTable.getSelectedItem();
            if (oSelectedItem) {
                var oBook = oSelectedItem.getBindingContext().getObject();
                MessageBox.confirm("Are you sure you want to delete this book?", {
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            this.deleteBook(oBook.ID);
                        }
                    }.bind(this)
                });
            } else {
                MessageBox.warning("Please select a book to delete.");
            }
        },

        deleteBook: function (sID) {
            var oContext = this.byId("booksTable").getSelectedItem().getBindingContext();

            if (oContext) {
                oContext.delete("$auto").then(function() {
                    MessageBox.success("Book deleted successfully");
                    this.calculateGrandTotal();
                }.bind(this)).catch(function(oError) {
                    MessageBox.error("Error deleting book: " + oError.message);
                });
            } else {
                MessageBox.error("Unable to delete book: No context available");
            }
        },

        onRefresh: function () {
            var oTable = this.byId("booksTable");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.refresh();
                MessageBox.info("Books list refreshed");
                this.calculateGrandTotal();
            } else {
                MessageBox.error("Unable to refresh: No binding found");
            }
        }
    });
});