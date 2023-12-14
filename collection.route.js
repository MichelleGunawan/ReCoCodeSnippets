const express = require("express");
const {
	createCollection,
	deleteCollection,
	getCollection,
	getCollectionMedia,

	getPublicCollections,
	getUserCollections,

	setVisibility,
	getLikes,
	getAdmins,
	addCollaborator,
	removeCollaborator,

	setAcceptRequest,
	getCollabRequests,
	addCollabRequest,
	acceptCollabRequest,
	removeCollabRequest,

	addUserToUserSaves,
	removeUserFromUserSaves,

	addLikeToCollection,
	removeLikeFromCollection,

	editCollection,
	addMedia,
	removeMedia,
	addLinks,
} = require("../controllers/collection.controller");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

// Create a new collection
router.post("/", verifyToken, createCollection);

// Delete a collection
router.delete("/collectionId/:collectionId", verifyToken, deleteCollection);

// Get a collection's details
router.get("/collectionId/:collectionId", verifyToken, getCollection);

// Get a collection's media
router.get(
	"/collectionId/:collectionId/media",
	verifyToken,
	getCollectionMedia,
);

// Get public collections
router.get("/public", getPublicCollections);

// Get albums of a specific user
router.get("/userId/:userId", verifyToken, getUserCollections);

// Set visibility of a collection
router.post(
	"/collectionId/:collectionId/visibility",
	verifyToken,
	setVisibility,
);

// Get likes of a collection
router.get("/collectionId/:collectionId/likes", verifyToken, getLikes);

// Get collaborators of a collection
router.get("/collectionId/:collectionId/admins", verifyToken, getAdmins);

// Add a collaborator to a collection
router.post(
	"/collectionId/:collectionId/collaborator/:userId",
	verifyToken,
	addCollaborator,
);

// Remove a collaborator from a collection
router.delete(
	"/collectionId/:collectionId/collaborator/:userId",
	verifyToken,
	removeCollaborator,
);

// Set accept request
router.post(
	"/collectionId/:collectionId/acceptRequests",
	verifyToken,
	setAcceptRequest,
);

// Get collaborator requests
router.get(
	"/collectionId/:collectionId/collaboratorRequest",
	verifyToken,
	getCollabRequests,
);

// Add a collaborator request to a collection
router.post(
	"/collectionId/:collectionId/collaboratorRequest",
	verifyToken,
	addCollabRequest,
);

// Accept a collaborator request
router.post(
	"/collectionId/:collectionId/acceptCollaboratorRequest",
	verifyToken,
	acceptCollabRequest,
);

// Reject a collaborator request
router.post(
	"/collectionId/:collectionId/removeCollaboratorRequest",
	verifyToken,
	removeCollabRequest,
);

// Add a user to userSaves
router.post(
	"/collectionId/:collectionId/usersaves",
	verifyToken,
	addUserToUserSaves,
);

// Remove a user from userSaves
router.delete(
	"/collectionId/:collectionId/usersaves",
	verifyToken,
	removeUserFromUserSaves,
);

// Add a like to a collection
router.post(
	"/collectionId/:collectionId/like",
	verifyToken,
	addLikeToCollection,
);

// Remove a like from a collection
router.delete(
	"/collectionId/:collectionId/like",
	verifyToken,
	removeLikeFromCollection,
	verifyToken,
);

// Edit an existing collection
router.post("/collectionId/:collectionId/edit", verifyToken, editCollection);

// Add media to collection
router.post("/addMedia", verifyToken, addMedia);

// Remove media from collection
router.post("/removeMedia", verifyToken, removeMedia);

// Add link to collection
router.post("/addLinks", verifyToken, addLinks);

module.exports = router;
