const router = require('express').Router();
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { uploadTryOnPhoto } = require('../../middleware/upload');
const controller = require('./aiStudio.controller');
const { createJobSchema, idParamSchema, listJobsQuerySchema } = require('./aiStudio.validators');

// Available to both staff (AI.html in the admin folder) and customers
// (AI.html in the storefront folder) — either can generate a try-on.
router.use(authenticate());

router.post('/jobs', uploadTryOnPhoto.single('photo'), validate({ body: createJobSchema }), controller.createJob);
router.get('/jobs', validate({ query: listJobsQuerySchema }), controller.listJobs);
router.get('/jobs/:id', validate({ params: idParamSchema }), controller.getJob);

module.exports = router;
