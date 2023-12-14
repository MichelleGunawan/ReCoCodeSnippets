const Collection = require("../models/Collection");
const Media = require("../models/Media");
const User = require("../models/User");
const Comment = require("../models/Comment");

exports.createCollection = async (req, res) => {
	const { name, description, visibility, acceptRequests, collaborators } =
		req.body;
	const { links, media } = req.body;
	const user = await User.findOne({ _id: req._id });

	if (!user) {
		return res.status(404).json({ message: "No User Found" });
	}
	try {
		const albumNameExists = await Collection.findOne({
			name: req.body.name,
			ownerId: user._id,
		});

		if (albumNameExists) {
			return res.status(403).json({
				error: "Album name is taken",
			});
		}

		let validCollaborators = [];
		let invalidCollaborators = [];

		if (Array.isArray(collaborators)) {
			for (const id of collaborators) {
				const collaboratorUser = await User.findOne({
					_id: id,
				});

				if (collaboratorUser) {
					validCollaborators.push(collaboratorUser._id);
				} else {
					invalidCollaborators.push(id);
				}
			}
		}
		//console.log("valid users:", validCollaborators);

		const collection = new Collection({
			ownerId: user._id,
			name: name,
			visibility: visibility,
			description: description,
			collaborators: validCollaborators,
			acceptRequests: acceptRequests,
		});

		await collection.save();

		//TODO: fix. we have three different arrays photo, upload, links
		//TODO: add photo to all album as well
		if (Array.isArray(links)) {
			for (const link of links) {
				const media = new Media({
					collectionId: collection._id,
					mediaType: "link",
					source: link.source,
					ownerUsername: user.username,
					ownerId: user._id,
				});
				await media.save();
			}
		}

		if (Array.isArray(media)) {
			for (const existingMedia of media) {
				const media = new Media({
					collectionId: collection._id,
					mediaType: existingMedia.mediaType,
					source: existingMedia.source,
					ownerUsername: user.username,
					ownerId: user._id,
				});
				await media.save();
			}
		}

		// TODO: upload list of files and add to collection
		// if (Array.isArray(files)) {
		//     for (const file of rfiles) {
		//         const media = new Media({
		//             collectionId: collection._id,
		//             mediaType: photoData.mediaType,
		//             source: photoData.source,
		//         });
		//         await media.save();
		//     }
		// }

		// Query up to four media items associated with the newly created collection.
		const mediaList = await Media.find({
			collectionId: collection._id,
		})
			.sort({ createdAt: -1 }) // Sort by creation date (you can choose another criterion)
			.limit(4);

		// Extract the media.source property and return it as an array
		const photos = mediaList.map(media => media.source);

		res.status(201).json({
			...collection.toObject(),
			photos,
		});
	} catch (err) {
		console.log("Failed to create album", err);
	}
};

//TODO: remove. replced by editCollection
exports.setVisibility = async (req, res) => {
	const { collectionId } = req.params;
	const { visibility } = req.body;

	console.log(collectionId, visibility);

	try {
		// Validate visibility value if needed
		// ...

		// Update the visibility field in the collection
		const updatedCollection = await Collection.findByIdAndUpdate(
			collectionId,
			{ visibility },
			{ new: true }, // Return the updated document
		);

		if (!updatedCollection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		res.status(200).json(updatedCollection);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

exports.editCollection = async (req, res) => {
	const { collectionId } = req.params;
	const { name, description, visibility, acceptRequests, collaborators } =
		req.body;
	const { links, media } = req.body;
	const user = await User.findOne({ _id: req._id });
	const collection = await Collection.findOne({ _id: collectionId });

	console.log(name, description);

	if (!user) {
		return res.status(404).json({ message: "No User Found" });
	}
	if (!collection) {
		return res.status(404).json({ message: "No Collection Found" });
	}
	try {
		// Check if user already has an collection with the same name
		const albumNameExists = await Collection.findOne({
			_id: { $ne: collection._id },
			name: req.body.name,
			ownerId: user._id,
		});

		if (albumNameExists) {
			return res.status(403).json({
				error: "Album name is taken",
			});
		}

		let validCollaborators = [];
		let invalidCollaborators = [];

		if (Array.isArray(collaborators)) {
			for (const id of collaborators) {
				const collaboratorUser = await User.findOne({
					_id: id,
				});

				if (collaboratorUser) {
					validCollaborators.push(collaboratorUser._id);
				} else {
					invalidCollaborators.push(id);
				}
			}
		}
		// Update collection properties
		if (name != null) {
			collection.name = name;
		}
		if (description != null) {
			collection.description = description;
		}
		if (visibility != null) {
			collection.visibility = visibility;
		}
		if (acceptRequests != null) {
			collection.acceptRequests = acceptRequests;
		}
		if (collaborators != null) {
			collection.collaborators = validCollaborators;
		}

		await collection.save();

		if (links || media) {
			//find all medias with collectionId matching collectionId param
			const allMedia = await Media.find({
				collectionId: collectionId,
			});

			// Create an array of media IDs from the 'media' array in the request
			const mediaIds = media.map(mediaItem => mediaItem._id);

			// Iterate through all media items and delete those not in mediaIds
			for (const mediaItem of allMedia) {
				if (!mediaIds.includes(mediaItem._id.toString())) {
					// The media item's _id is not in the media list, so delete it
					await mediaItem.remove();
				}
			}
		}

		//TODO: fix. we have three different arrays photo, upload, links
		//TODO: add photo to all album as well
		if (links && Array.isArray(links)) {
			for (const link of links) {
				const media = new Media({
					collectionId: collection._id,
					mediaType: "link",
					source: link.source,
					ownerUsername: user.username,
					ownerId: user._id,
				});
				await media.save();
			}
		}

		// TODO: upload list of files and add to collection
		// if (Array.isArray(files)) {
		//     for (const file of rfiles) {
		//         const media = new Media({
		//             collectionId: collection._id,
		//             mediaType: photoData.mediaType,
		//             source: photoData.source,
		//         });
		//         await media.save();
		//     }
		// }

		// Query up to four media items associated with the newly created collection.
		const mediaList = await Media.find({
			collectionId: collectionId,
		})
			.sort({ createdAt: -1 }) // Sort by creation date (you can choose another criterion)
			.limit(4);
		console.log(mediaList);

		// Extract the media.source property and return it as an array
		const photos = mediaList.map(media => media.source);

		res.status(201).json({
			...collection.toObject(),
			photos,
		});
	} catch (err) {
		console.log("Failed to create album", err);
	}
};

// Delete collection
exports.deleteCollection = async (req, res) => {
	const collectionId = req.params.collectionId;
	const userId = req._id; // Assuming you have user information available in the request

	try {
		// Check if the collection exists and the user is the owner
		const collection = await Collection.findOne({
			_id: collectionId,
			ownerId: userId,
		});
		if (!collection) {
			return res.status(404).json({
				message:
					"Collection not found or you don't have permission to delete it.",
			});
		}

		// Find and delete associated media items
		await Media.deleteMany({ _id: collection._id });
		// TODO: check if any other media has the same source. if not, delete actual file in

		// Delete the collection
		await collection.remove();

		res.status(200).json({ message: "Collection deleted successfully." });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// Get collection details
exports.getCollection = async (req, res) => {
	const collectionId = req.params.collectionId;
	const userId = req._id; // Assuming you have user information available in the request

	try {
		// Check if the collection exists
		const collection = await Collection.findOne({ _id: collectionId })
			.populate({
				path: "ownerId",
				select: "_id username profilePhoto",
				as: "owner",
			})
			.populate("userLikes", "_id username profilePhoto")
			.populate("collaborators", "_id username profilePhoto")
			.populate("collaboratorRequests", "_id username profilePhoto")
			.lean();

		if (!collection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		// Check if the requesting user is the owner or a collaborator
		if (
			collection.visibility == "private" &&
			collection.ownerId._id.toString() !== userId.toString() &&
			!collection.collaborators.some(
				collaborator => collaborator._id.toString() === userId.toString(),
			)
		) {
			return res.status(403).json({
				message: "You don't have permission to view this collection.",
			});
		}

		// Extract like details
		const userLikeDetails = collection.userLikes.map(user => ({
			_id: user._id,
			username: user.username,
			profilePhoto: user.profilePhoto,
		}));

		// Extract collaboratorRequests details
		const collaboratorRequestsDetails = collection.collaboratorRequests.map(
			request => ({
				_id: request._id,
				username: request.username,
				profilePhoto: request.profilePhoto,
			}),
		);

		const comments = await Comment.find({
			collectionId: collectionId,
		})
			.populate("userId", "_id username profilePhoto")
			.populate("mediaId", "_id mediaType source");

		const formattedComments = await Promise.all(
			comments.map(async comment => {
				// Extract basic comment properties
				const formattedComment = {
					_id: comment._id,
					userId: comment.userId._id,
					username: comment.userId.username,
					profilePhoto: comment.userId.profilePhoto,
					comment: comment.comment,
					userLikes: comment.userLikes,
					mediaId: comment.mediaId ?? undefined,
					// mediaId: comment.mediaId ? comment.mediaId._id : undefined,
					// mediaType: comment.mediaId ? comment.mediaId.mediaType : undefined,
					// mediaSource: comment.mediaId ? comment.mediaId.source : undefined,
				};

				return formattedComment;
			}),
		);

		// Return the collection details and associated photos
		res.status(200).json({
			...collection,
			owner: collection.ownerId,
			userLikes: userLikeDetails,
			comments: formattedComments,
			collaboratorRequests: collaboratorRequestsDetails,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// Get collection media
exports.getCollectionMedia = async (req, res) => {
	const collectionId = req.params.collectionId;
	const userId = req._id; // Assuming you have user information available in the request

	try {
		// Check if the collection exists
		const collection = await Collection.findOne({ _id: collectionId });

		if (!collection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		// Check if the requesting user is the owner or a collaborator
		if (
			collection.visibility == "private" &&
			collection.ownerId.toString() !== userId.toString() &&
			!collection.collaborators.some(
				collaborator => collaborator._id.toString() === userId.toString(),
			)
		) {
			return res.status(403).json({
				message: "You don't have permission to view this collection.",
			});
		}

		console.log("collectionId", collectionId);

		// Find and retrieve associated media items
		const photos = await Media.find({ collectionId: collectionId })
			.sort({
				createdAt: -1,
			})
			.populate("ownerId", "_id username profilePhoto")
			.populate("userLikes", "_id username profilePhoto");

		// Format media
		const transformedPhotos = await Promise.all(
			photos.map(async photo => {
				if (!photo || !photo.ownerId || !photo.ownerId._id) {
					// Handle the case where photo or ownerId is undefined
					return null; // or provide a default value
				}

				const photoComments = await Comment.find({
					mediaId: photo._id,
				}).populate("userId", "_id username profilePhoto");

				return {
					_id: photo._id,
					source: photo.source,
					mediaType: photo.mediaType,
					collectionId: photo.collectionId,
					createdAt: photo.createdAt,
					caption: photo.caption,
					ownerId: photo.ownerId._id,
					ownerUsername: photo.ownerId.username,
					profilePhoto: photo.ownerId.profilePhoto,
					userLikes: photo.userLikes,
					comments: photoComments.map(comment => ({
						userId: comment.userId._id,
						username: comment.userId.username,
						profilePhoto: comment.userId.profilePhoto,
						comment: comment.comment,
						userLikes: comment.userLikes,
					})),
				};
			}),
		);

		return res.status(200).json({ photos: transformedPhotos });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

exports.getPublicCollections = async (req, res) => {
	try {
		// Query the database to find all collections with visibility set to "public"
		const publicCollections = await Collection.find({ visibility: "public" });
		console.log("publicCollections: ", publicCollections);

		// Prepare the response data for each public collection
		const publicCollectionResponse = [];
		for (const collection of publicCollections) {
			// Find and retrieve associated media items, limiting to the top four
			const mediaList = await Media.find({
				collectionId: collection._id,
				mediaType: "photo", // Ensure media with photo property
			})
				.sort({ createdAt: -1 }) // Sort by creation date (you can choose another criterion)
				.limit(4);

			// Extract the media.source property and return it as an array
			const photos = mediaList.map(media => media.source);

			// Count the number of userLikes
			const userSavesCount = collection.userSaves.length;

			// Create an object with specific fields from the collection
			const collectionResponse = {
				_id: collection._id,
				ownerId: collection.ownerId,
				name: collection.name,
				userSavesCount: userSavesCount,
				photos: photos, // Include the photos property
			};

			publicCollectionResponse.push(collectionResponse);
		}

		// Return the list of public albums
		res.status(200).json({ collections: publicCollectionResponse });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// get a user's collections
exports.getUserCollections = async (req, res) => {
	const requestingUserId = req._id; // Assuming you have user information available in the request
	const userIdParam = req.params.userId; // User ID from the route parameter

	try {
		let userCollections = [];

		// Check if the requesting user is the owner or collaborator
		if (userIdParam === requestingUserId) {
			// If the userId parameter matches the requesting user's ID, return all albums
			userCollections = await Collection.find({ ownerId: userIdParam });
		} else {
			// If the userId parameter is different, return public albums and albums where the owner is a collaborator
			userCollections = await Collection.find({
				$or: [
					{ ownerId: userIdParam, visibility: "public" },
					{ collaborators: userIdParam },
				],
			});
		}

		// Prepare the response data for each user's album
		const userAlbumsResponse = [];
		for (const collection of userCollections) {
			// Find and retrieve associated media items, limiting to the top four
			const mediaList = await Media.find({
				collectionId: collection._id,
				mediaType: "photo", // Ensure media with photo property
			})
				.sort({ createdAt: -1 }) // Sort by creation date (you can choose another criterion)
				.limit(4);

			// Extract the media.source property and return it as an array
			const photos = mediaList.map(media => media.source);

			// Count the number of userLikes
			const userSavesCount = collection.userSaves.length;

			// Create an object with specific fields from the collection
			const collectionResponse = {
				_id: collection._id,
				ownerId: collection.ownerId,
				name: collection.name,
				visibility: collection.visibility,
				userSavesCount: userSavesCount,
				photos: photos, // Include the photos property
			};

			userAlbumsResponse.push(collectionResponse);
		}

		// Return the list of user's albums
		res.status(200).json({ userAlbums: userAlbumsResponse });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// Get collection likes
exports.getLikes = async (req, res) => {
	const { collectionId } = req.params;

	try {
		// Find the collection by ID and populate the 'ownerId' and 'collaborators' fields
		const collection = await Collection.findById(collectionId).populate(
			"userLikes",
			"_id username profilePhoto",
		);

		if (!collection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		// Extract like details
		const userLikeDetails = collection.userLikes.map(user => ({
			_id: user._id,
			username: user.username,
			profilePhoto: user.profilePhoto,
		}));

		res.status(200).json(userLikeDetails);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// Get collaborators (owner+collaborators)
exports.getAdmins = async (req, res) => {
	const { collectionId } = req.params;

	try {
		// Find the collection by ID and populate the 'ownerId' and 'collaborators' fields
		const collection = await Collection.findById(collectionId)
			.populate("ownerId", "_id username profilePhoto")
			.populate("collaborators", "_id username profilePhoto");

		if (!collection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		// Extract owner details
		const ownerDetails = {
			_id: collection.ownerId._id,
			username: collection.ownerId.username,
			profilePhoto: collection.ownerId.profilePhoto,
		};

		// Extract collaborator details
		const collaboratorDetails = collection.collaborators.map(collaborator => ({
			_id: collaborator._id,
			username: collaborator.username,
			profilePhoto: collaborator.profilePhoto,
		}));

		// Combine owner and collaborator details
		const collaborators = [ownerDetails, ...collaboratorDetails];

		res.status(200).json(collaborators);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// Add collaborator
exports.addCollaborator = async (req, res) => {
	const collectionId = req.params.collectionId;
	const collaboratorId = req.params.userId;
	const userId = req._id; // Assuming you have user information available in the request

	try {
		// Check if the collection exists
		const collection = await Collection.findOne({ _id: collectionId });

		if (!collection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		// Check if the requesting user is the owner or a collaborator
		if (
			collection.ownerId.toString() !== userId.toString() &&
			!collection.collaborators.some(
				collaborator => collaborator._id.toString() === userId.toString(),
			)
		) {
			return res.status(403).json({
				message:
					"You don't have permission to add a collaborator to this collection.",
			});
		}

		// Check if the user to be added as a collaborator exists
		const user = await User.findOne({ _id: collaboratorId });

		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		// Check if the user is already a collaborator
		if (collection.collaborators.includes(collaboratorId)) {
			return res.status(400).json({
				message: "User is already a collaborator of this collection.",
			});
		}

		// Add the user as a collaborator
		collection.collaborators.push(collaboratorId);
		await collection.save();

		res.status(200).json({ message: "Collaborator added successfully." });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// Remove collaborator
exports.removeCollaborator = async (req, res) => {
	const collectionId = req.params.collectionId;
	const collaboratorId = req.params.userId;
	const userId = req._id; // Assuming you have user information available in the request

	try {
		// Check if the collection exists
		const collection = await Collection.findOne({ _id: collectionId });

		if (!collection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		// Check if the requesting user is the owner or a collaborator
		if (
			collection.ownerId.toString() !== userId.toString() &&
			!collection.collaborators.some(
				collaborator => collaborator._id.toString() === userId.toString(),
			)
		) {
			return res.status(403).json({
				message:
					"You don't have permission to add a collaborator to this collection.",
			});
		}

		// Check if the user to be removed is a collaborator
		if (!collection.collaborators.includes(collaboratorId)) {
			return res
				.status(400)
				.json({ message: "User is not a collaborator of this collection." });
		}

		// Remove the user from the collaborators array
		collection.collaborators = collection.collaborators.filter(
			c => c.toString() !== collaboratorId,
		);

		await collection.save();

		res.status(200).json({ message: "Collaborator removed successfully." });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// Update acceptCollaboration status
exports.setAcceptRequest = async (req, res) => {
	const collectionId = req.params.collectionId;
	const { acceptRequests } = req.body;

	try {
		const collection = await Collection.findById(collectionId);

		if (!collection) {
			return res.status(404).json({ message: "Collection not found" });
		}
		console.log("acceptRequests", acceptRequests, collection);

		collection.acceptRequests = acceptRequests;
		await collection.save();

		res.json({ message: "AcceptCollaboration updated successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal Server Error" });
	}
};

// Route to add collaborator request
exports.addCollabRequest = async (req, res) => {
	const collectionId = req.params.collectionId;
	const userId = req._id;

	try {
		const updatedCollection = await Collection.findByIdAndUpdate(
			collectionId,
			{ $push: { collaboratorRequests: userId } },
			{ new: true },
		);

		res.json(updatedCollection);
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Route to get collaborator requests with user information
exports.getCollabRequests = async (req, res) => {
	const collectionId = req.params.collectionId;

	try {
		// Find the collection based on the provided ID and populate collaboratorRequests with user information
		const collection = await Collection.findById(collectionId).populate(
			"collaboratorRequests",
			"_id username profilePhoto",
		);

		if (!collection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		// Extract and format user information
		const collaboratorRequests = collection.collaboratorRequests.map(user => ({
			_id: user._id,
			username: user.username,
			profilePhoto: user.profilePhoto,
		}));

		// Return the formatted collaboratorRequests array
		res.json(collaboratorRequests);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Route to accept collaborator request
exports.acceptCollabRequest = async (req, res) => {
	const collectionId = req.params.collectionId;
	const { userId } = req.body;
	const loggedInUserId = req._id;

	try {
		// Check if the collection exists
		const collection = await Collection.findById(req.params.collectionId);

		if (!collection) {
			return res.status(404).json({ message: "Collection not found" });
		}

		// Check if the user exists
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Check if the requesting user is the owner or a collaborator
		if (
			collection.ownerId.toString() !== loggedInUserId.toString() &&
			!collection.collaborators.some(
				collaborator =>
					collaborator._id.toString() === loggedInUserId.toString(),
			)
		) {
			return res.status(403).json({
				message:
					"You don't have permission to add a collaborator to this collection.",
			});
		}

		await Collection.findByIdAndUpdate(
			collectionId,
			{
				$pull: { collaboratorRequests: userId },
				$push: { collaborators: userId },
			},
			{ new: true },
		);

		res.json({
			_id: userId._id,
			username: user.username,
			profilePhoto: user.profilePhoto,
		});
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error" });
	}
};

exports.removeCollabRequest = async (req, res) => {
	const collectionId = req.params.collectionId;
	const { userId } = req.body;
	const loggedInUserId = req._id;

	try {
		// Check if the collection exists
		const collection = await Collection.findById(collectionId);
		if (!collection) {
			return res.status(404).json({ message: "Collection not found" });
		}

		// Check if the requesting user is the owner or a collaborator
		if (
			collection.ownerId.toString() !== loggedInUserId.toString() &&
			!collection.collaborators.some(
				collaborator =>
					collaborator._id.toString() === loggedInUserId.toString(),
			)
		) {
			return res.status(403).json({
				message:
					"You don't have permission to add a collaborator to this collection.",
			});
		}

		const index = collection.collaboratorRequests.indexOf(userId);

		if (index !== -1) {
			collection.collaboratorRequests.splice(index, 1);
			await collection.save();

			res.json({ collaboratorRequests: collection.collaboratorRequests });
		} else {
			res
				.status(400)
				.json({ collaboratorRequests: collection.collaboratorRequests });
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal Server Error" });
	}
};

// Add a user to userSaves
exports.addUserToUserSaves = async (req, res) => {
	const collectionId = req.params.collectionId;
	const userId = req._id; // Assuming you have user information available in the request

	try {
		// Check if the collection exists
		const collection = await Collection.findOne({ _id: collectionId });

		if (!collection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		// Check if the user is already in userSaves
		if (collection.userSaves.includes(userId)) {
			return res
				.status(400)
				.json({ message: "User is already in userSaves of this collection." });
		}

		// Add the user to userSaves
		collection.userSaves.push(userId);
		await collection.save();

		res.status(200).json({ message: "User added to userSaves successfully." });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// Remove a user from userSaves
exports.removeUserFromUserSaves = async (req, res) => {
	const collectionId = req.params.collectionId;
	const userId = req._id; // Assuming you have user information available in the request

	try {
		// Check if the collection exists
		const collection = await Collection.findOne({ _id: collectionId });

		if (!collection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		// Check if the user is in userSaves
		if (!collection.userSaves.includes(userId)) {
			return res
				.status(400)
				.json({ message: "User is not in userSaves of this collection." });
		}

		// Remove the user from userSaves
		collection.userSaves = collection.userSaves.filter(
			savedUser => savedUser.toString() !== userId.toString(),
		);
		await collection.save();

		res
			.status(200)
			.json({ message: "User removed from userSaves successfully." });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// Add a like to a collection
exports.addLikeToCollection = async (req, res) => {
	const { collectionId } = req.params;
	const userId = req._id;

	try {
		// Check if the user exists
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		// Find the collection by its ID
		const collection = await Collection.findById(collectionId);

		if (!collection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		// Check if the user already likes the collection
		if (collection.userLikes.includes(userId)) {
			return res
				.status(400)
				.json({ message: "You already liked this collection." });
		}

		// Add the user's ID to the collection's likes
		collection.userLikes.push(userId);
		await collection.save();

		res.status(200).json({ message: "Like added to the collection." });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// Remove a like from a collection
exports.removeLikeFromCollection = async (req, res) => {
	const { collectionId } = req.params;
	const userId = req._id;

	try {
		// Check if the user exists
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		// Find the collection by its ID
		const collection = await Collection.findById(collectionId);

		if (!collection) {
			return res.status(404).json({ message: "Collection not found." });
		}

		// Check if the user has liked the collection
		if (!collection.userLikes.includes(userId)) {
			return res
				.status(400)
				.json({ message: "You haven't liked this collection." });
		}

		console.log(collection);
		// Remove the user's ID from the collection's likes
		collection.userLikes = collection.userLikes.filter(
			id => id.toString() !== userId.toString(),
		);
		await collection.save();

		res.status(200).json({ message: "Like removed from the collection." });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

// Add media
exports.addMedia = async (req, res) => {
	try {
		const { mediaList, collectionList } = req.body;
		console.log("mediaList", mediaList, "collectionList:", collectionList);

		// Loop through the collection list
		for (const collectionId of collectionList) {
			const collection = await Collection.findById(collectionId);

			if (!collection) {
				continue;
				//return res.status(404).json({ message: "Collection not found" });
			}

			// Loop through the media list
			for (const mediaId of mediaList) {
				const media = await Media.findById(mediaId);
				if (!media) {
					continue;
					//return res.status(404).json({ message: "Collection not found" });
				}
				// Create a new Media object
				const newMedia = new Media({
					collectionId: collection._id,
					mediaType: media.mediaType,
					source: media.source,
					ownerId: media.ownerId,
					ownerUsername: media.ownerUsername,
					caption: media.caption,
				});

				await newMedia.save();

				console.log("media", newMedia);
			}
		}

		return res
			.status(200)
			.json({ message: "Media added to collections successfully" });
	} catch (error) {
		return res
			.status(500)
			.json({ message: "An error occurred while adding media to collections" });
	}
};

// Remove media
exports.removeMedia = async (req, res) => {
	try {
		const { mediaList } = req.body;

		// Loop through the media list
		for (const mediaId of mediaList) {
			// Find the media object by its ID
			const media = await Media.findById(mediaId);

			if (!media) {
				continue;
				// You can choose to return a 404 response if a media is not found
				// return res.status(404).json({ message: "Media not found" });
			}

			// Delete the media object from the database
			await media.remove();
		}

		return res.status(200).json({
			message: "Media removed from collections and deleted successfully",
		});
	} catch (error) {
		return res.status(500).json({
			message: `An error occurred while deleting media from collections ${error}`,
		});
	}
};

// Add Links
exports.addLinks = async (req, res) => {
	try {
		const { linkList, collectionList } = req.body;
		const userId = req._id;

		let newMedia = [];

		// Check if the user exists
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		// Loop through the collection list
		for (const collectionId of collectionList) {
			const collection = await Collection.findById(collectionId);

			if (!collection) {
				continue;
				//return res.status(404).json({ message: "Collection not found" });
			}

			// Loop through the media list
			for (const link of linkList) {
				const media = new Media({
					collectionId: collectionId,
					mediaType: "link",
					source: link,
					ownerUsername: user.username,
					ownerId: user._id,
				});
				await media.save();

				newMedia.push(media);
			}
		}

		return res.status(200).json(newMedia);
	} catch (error) {
		return res
			.status(500)
			.json({ message: "An error occurred while adding media to collections" });
	}
};
