const initialState = {
	collection: {},
};

const collectionReducer = (state = initialState, action) => {
	switch (action.type) {
		case "SET_COLLECTION":
			return {
				...state,
				collection: {
					...state.collection,
					_id: action.payload._id,
					name: action.payload.name,
					description: action.payload.description,
					visibility: action.payload.visibility,
					acceptRequests: action.payload.acceptRequests,
					owner: action.payload.owner,
					collaborators: action.payload.collaborators,
					collaboratorRequests: action.payload.collaboratorRequests,
					userLikes: action.payload.userLikes,
					userSaves: action.payload.userSaves,
					comments: action.payload.comments,
				},
			};

		case "EDIT_COLLECTION":
			return {
				...state,
				collection: {
					...state.collection,
					name: action.payload.name ?? state.collection.name,
					description:
						action.payload.description ?? state.collection.description,
					visibility: action.payload.visibility ?? state.collection.visibility,
					acceptRequests:
						action.payload.acceptRequests ?? state.collection.acceptRequests,
					collaborators:
						action.payload.collaborators ?? state.collection.collaborators,
				},
			};

		case "SET_MEDIA":
			return {
				...state,
				collection: {
					...state.collection,
					photos: action.payload,
				},
			};

		case "SET_LIKES":
			return {
				...state,
				collection: {
					...state.collection,
					userLikes: action.payload,
				},
			};
		case "ADD_LIKE":
			return {
				...state,
				collection: {
					...state.collection,
					userLikes: [...state.collection.userLikes, action.payload],
				},
			};
		case "REMOVE_LIKE":
			return {
				...state,
				collection: {
					...state.collection,
					userLikes: state.collection.userLikes.filter(like => {
						return like._id !== action.payload;
					}),
				},
			};
		case "ADD_COMMENT":
			return {
				...state,
				collection: {
					...state.collection,
					comments: [...state.collection.comments, action.payload],
				},
			};
		case "REMOVE_COMMENT":
			return {
				...state,
				collection: {
					...state.collection,
					comments: state.collection.comments.filter(comment => {
						return comment._id !== action.payload;
					}),
				},
			};
		case "ADD_MEDIA":
			return {
				...state,
				collection: {
					...state.collection,
					photos: [...action.payload, ...state.collection.photos],
				},
			};
		case "REMOVE_MEDIA":
			return {
				...state,
				collection: {
					...state.collection,
					photos: state.collection.photos.filter(
						photo => !action.payload.includes(photo._id),
					),
				},
			};
		case "ADD_PHOTO_LIKE":
			return {
				...state,
				collection: {
					...state.collection,
					photos: state.collection.photos.map(photo => {
						if (photo._id === action.payload.photoId) {
							return {
								...photo,
								userLikes: [...photo.userLikes, action.payload.user],
							};
						}
						return photo;
					}),
				},
			};
		case "REMOVE_PHOTO_LIKE":
			return {
				...state,
				collection: {
					...state.collection,
					photos: state.collection.photos.map(photo => {
						if (photo._id === action.payload.photoId) {
							return {
								...photo,
								userLikes: photo.userLikes.filter(
									user => user._id !== action.payload.userId,
								),
							};
						}
						return photo;
					}),
				},
			};
		case "SET_MEDIA_COMMENTS":
			return {
				...state,
				collection: {
					...state.collection,
					photos: state.collection.photos.map(photo => {
						if (photo._id === action.payload.photoId) {
							return {
								...photo,
								comments: action.payload.comments,
							};
						}
						return photo;
					}),
				},
			};
		case "ADD_MEDIA_COMMENT":
			return {
				...state,
				collection: {
					...state.collection,
					photos: state.collection.photos.map(photo => {
						if (photo._id === action.payload.mediaId._id) {
							return {
								...photo,
								comments: [...photo.comments, action.payload],
							};
						}
						return photo;
					}),
				},
			};
		case "REMOVE_MEDIA_COMMENT":
			return {
				...state,
				collection: {
					...state.collection,
					photos: state.collection.photos.map(photo => {
						if (photo._id === action.payload.photoId) {
							return {
								...photo,
								comments: photo.comments.filter(
									comment => comment._id !== action.payload.commentId,
								),
							};
						}
						return photo;
					}),
				},
			};
		case "SET_MEDIA_CAPTION":
			return {
				...state,
				collection: {
					...state.collection,
					photos: state.collection.photos.map(photo => {
						if (photo._id === action.payload.mediaId) {
							return {
								...photo,
								caption: action.payload.caption,
							};
						}
						return photo;
					}),
				},
			};
		//TODO: remove reducer
		case "SET_ADMINS":
			return {
				...state,
				collection: {
					...state.collection,
					admins: action.payload,
				},
			};

		case "ADD_SAVE":
			console.log("adding save:", action.payload, {
				...state,
				collection: {
					...state.collection,
					userSaves: [...state.collection.userSaves, action.payload],
				},
			});
			return {
				...state,
				collection: {
					...state.collection,
					userSaves: [...state.collection.userSaves, action.payload],
				},
			};
		case "REMOVE_SAVE":
			console.log("removing save:", action.payload, {
				...state,
				collection: {
					...state.collection,
					userSaves: state.collection.userSaves.filter(
						userId => userId !== action.payload,
					),
				},
			});
			return {
				...state,
				collection: {
					...state.collection,
					userSaves: state.collection.userSaves.filter(
						userId => userId !== action.payload,
					),
				},
			};
		case "SET_COLLAB_REQUESTS":
			return {
				...state,
				collection: {
					...state.collection,
					collaboratorRequests: action.payload,
				},
			};
		case "ADD_COLLAB_REQUEST":
			return {
				...state,
				collection: {
					...state.collection,
					collaboratorRequests: [
						...state.collection.collaboratorRequests,
						action.payload,
					],
				},
			};
		case "ACCEPT_COLLAB_REQUEST":
			return {
				...state,
				collection: {
					...state.collection,
					collaborators: [...state.collection.collaborators, action.payload],
					collaboratorRequests: state.collection.collaboratorRequests.filter(
						collab => collab._id !== action.payload._id,
					),
				},
			};
		case "REMOVE_COLLAB_REQUEST":
			return {
				...state,
				collection: {
					...state.collection,
					collaboratorRequests: state.collection.collaboratorRequests.filter(
						collab => collab._id !== action.payload,
					),
				},
			};
		case "REMOVE_COLLABORATOR":
			return {
				...state,
				collection: {
					...state.collection,
					collaborators: state.collection.collaborators.filter(
						collab => collab._id !== action.payload,
					),
				},
			};
		default:
			return state;
	}
};

export default collectionReducer;
