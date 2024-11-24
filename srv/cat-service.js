const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  const { Books } = this.entities;

  // READ operation
  this.on('READ', 'Books', async (req) => {
    const { ID } = req.data;
    if (ID) {
      return await SELECT.from(Books).where({ ID: ID });
    } else {
      return await SELECT.from(Books);
    }
  });

  // CREATE operation
  // this.on('CREATE', 'Books', async (req) => {
  //   const { ID, title, stock } = req.data;
  //   const result = await INSERT.into(Books).entries({ ID, title, stock });
  //   return result;
  // });
  this.before('CREATE', 'Books', (req) => {
    if (!req.data.ID) {
        // Generate an ID if not provided
        req.data.ID = cds.utils.uuid()  // Using CDS utility for UUID generation
    }
    req.data.price = parseFloat(req.data.price)
    req.data.stock = parseInt(req.data.stock)
})

this.on('CREATE', 'Books', async (req) => {
    const book = req.data
    const result = await cds.transaction(req).run(
        INSERT.into(Books).entries(book)
    )
    return result
  })
  
  this.on('isInStock', async (req) => {
    const bookId = req.data.book;
    const book = await SELECT.from(Books).where({ ID: bookId });
    if (book.length > 0 && book[0].stock > 0) {
      return true;
    }
    return false;
  });
});