export function notFound(req, res) { res.status(404).json({ message: `Route ${req.method} ${req.path} was not found.` }); }
export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ message: 'Validation failed.', details: Object.values(err.errors).map(e => e.message) });
  if (err.code === 11000) return res.status(409).json({ message: 'An account with that email already exists.' });
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong. Please try again.' });
}
