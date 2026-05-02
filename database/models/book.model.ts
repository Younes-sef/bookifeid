import { Schema, model, models } from "mongoose";

const BookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  coverUrl: { type: String },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Book = models.Book || model('Book', BookSchema);
export default Book;
