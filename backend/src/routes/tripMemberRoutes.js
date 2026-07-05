const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  listMembers, inviteMember, setMySharing, setMyUpi, acceptInvite, removeMember,
} = require('../controllers/tripMemberController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', listMembers);
router.post('/', inviteMember);
router.patch('/me/sharing', setMySharing);
router.patch('/me/upi', setMyUpi);
router.patch('/accept', acceptInvite);
router.delete('/:memberId', removeMember);

module.exports = router;
