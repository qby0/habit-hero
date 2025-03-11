const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');

// Защищаем все маршруты с помощью auth middleware
router.use(auth);

// @route   GET api/groups
// @desc    Get all groups
// @access  Private
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/groups/user
// @desc    Get groups for current user
// @access  Private
router.get('/user', async (req, res) => {
  try {
    // Find groups where user is a member or admin
    const groups = await Group.find({
      $or: [
        { members: req.user.id },
        { admin: req.user.id }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/groups
// @desc    Create a new group
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { name, description, isPrivate, maxMembers } = req.body;
    
    // Create new group
    const newGroup = new Group({
      name,
      description,
      admin: req.user.id,
      isPrivate,
      maxMembers
    });
    
    // Add creator as a member
    newGroup.members.push(req.user.id);
    
    const group = await newGroup.save();
    
    // Update user's groups
    const user = await User.findById(req.user.id);
    user.groups.push(group._id);
    await user.save();
    
    res.json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/groups/:id
// @desc    Get group by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('admin', ['username', 'avatar'])
      .populate('members', ['username', 'avatar']);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if user is a member or admin if group is private
    if (group.isPrivate) {
      const isMember = group.members.some(member => member._id.toString() === req.user.id);
      const isAdmin = group.admin._id.toString() === req.user.id;
      
      if (!isMember && !isAdmin) {
        return res.status(401).json({ msg: 'Not authorized to view this group' });
      }
    }
    
    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/groups/:id
// @desc    Update a group
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if user is admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this group' });
    }
    
    const { name, description, isPrivate, maxMembers } = req.body;
    
    // Update fields
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (isPrivate !== undefined) group.isPrivate = isPrivate;
    if (maxMembers) group.maxMembers = maxMembers;
    
    await group.save();
    
    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/groups/:id
// @desc    Delete a group
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if user is admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this group' });
    }
    
    // Remove group from all members' groups array
    await User.updateMany(
      { _id: { $in: group.members } },
      { $pull: { groups: group._id } }
    );
    
    await group.remove();
    
    res.json({ msg: 'Group removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/groups/:id/join
// @desc    Join a group
// @access  Private
router.post('/:id/join', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if group is private
    if (group.isPrivate) {
      return res.status(400).json({ msg: 'Cannot join a private group directly' });
    }
    
    // Check if user is already a member
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Already a member of this group' });
    }
    
    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ msg: 'Group is full' });
    }
    
    // Add user to group members
    group.members.push(req.user.id);
    
    // Update user's groups
    const user = await User.findById(req.user.id);
    user.groups.push(group._id);
    
    await group.save();
    await user.save();
    
    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.post('/:id/leave', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if user is a member
    if (!group.members.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Not a member of this group' });
    }
    
    // Check if user is the admin
    if (group.admin.toString() === req.user.id) {
      return res.status(400).json({ msg: 'Admin cannot leave the group. Transfer ownership or delete the group.' });
    }
    
    // Remove user from group members
    group.members = group.members.filter(
      member => member.toString() !== req.user.id
    );
    
    // Remove group from user's groups
    const user = await User.findById(req.user.id);
    user.groups = user.groups.filter(
      groupId => groupId.toString() !== group._id.toString()
    );
    
    await group.save();
    await user.save();
    
    res.json({ msg: 'Left the group successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/groups/:id/invite
// @desc    Invite a user to a group
// @access  Private
router.post('/:id/invite', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if user is admin or member
    const isMember = group.members.includes(req.user.id);
    const isAdmin = group.admin.toString() === req.user.id;
    
    if (!isMember && !isAdmin) {
      return res.status(401).json({ msg: 'Not authorized to invite to this group' });
    }
    
    const { userId } = req.body;
    
    // Check if user exists
    const invitedUser = await User.findById(userId);
    
    if (!invitedUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if user is already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ msg: 'User is already a member' });
    }
    
    // Check if user is already invited
    if (group.invites.includes(userId)) {
      return res.status(400).json({ msg: 'User is already invited' });
    }
    
    // Add user to invites
    group.invites.push(userId);
    
    // Add group to user's invites
    invitedUser.groupInvites.push(group._id);
    
    await group.save();
    await invitedUser.save();
    
    res.json({ msg: 'Invitation sent successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group or user not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/groups/:id/accept
// @desc    Accept a group invitation
// @access  Private
router.post('/:id/accept', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    const user = await User.findById(req.user.id);
    
    // Check if user has an invitation
    if (!group.invites.includes(req.user.id) || !user.groupInvites.includes(group._id)) {
      return res.status(400).json({ msg: 'No invitation found' });
    }
    
    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ msg: 'Group is full' });
    }
    
    // Remove from invites
    group.invites = group.invites.filter(
      invite => invite.toString() !== req.user.id
    );
    
    user.groupInvites = user.groupInvites.filter(
      invite => invite.toString() !== group._id.toString()
    );
    
    // Add to members
    group.members.push(req.user.id);
    user.groups.push(group._id);
    
    await group.save();
    await user.save();
    
    res.json({ msg: 'Invitation accepted', group });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/groups/:id/decline
// @desc    Decline a group invitation
// @access  Private
router.post('/:id/decline', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    const user = await User.findById(req.user.id);
    
    // Check if user has an invitation
    if (!group.invites.includes(req.user.id) || !user.groupInvites.includes(group._id)) {
      return res.status(400).json({ msg: 'No invitation found' });
    }
    
    // Remove from invites
    group.invites = group.invites.filter(
      invite => invite.toString() !== req.user.id
    );
    
    user.groupInvites = user.groupInvites.filter(
      invite => invite.toString() !== group._id.toString()
    );
    
    await group.save();
    await user.save();
    
    res.json({ msg: 'Invitation declined' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/groups/:id/kick/:userId
// @desc    Kick a user from a group
// @access  Private
router.post('/:id/kick/:userId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if user is admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to kick members' });
    }
    
    const userToKick = req.params.userId;
    
    // Check if user is a member
    if (!group.members.includes(userToKick)) {
      return res.status(400).json({ msg: 'User is not a member of this group' });
    }
    
    // Cannot kick admin
    if (group.admin.toString() === userToKick) {
      return res.status(400).json({ msg: 'Cannot kick the admin' });
    }
    
    // Remove user from group members
    group.members = group.members.filter(
      member => member.toString() !== userToKick
    );
    
    // Remove group from user's groups
    await User.findByIdAndUpdate(userToKick, {
      $pull: { groups: group._id }
    });
    
    await group.save();
    
    res.json({ msg: 'User kicked from the group' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group or user not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/groups/:id/transfer/:userId
// @desc    Transfer group ownership
// @access  Private
router.post('/:id/transfer/:userId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if user is admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to transfer ownership' });
    }
    
    const newAdmin = req.params.userId;
    
    // Check if new admin is a member
    if (!group.members.includes(newAdmin)) {
      return res.status(400).json({ msg: 'User is not a member of this group' });
    }
    
    // Transfer ownership
    group.admin = newAdmin;
    
    await group.save();
    
    res.json({ msg: 'Group ownership transferred', group });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group or user not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router; 