import multer from "multer";
import path from "path";
import fs from "fs";

const galleryUploadPath = path.resolve(
    "src/uploads/gallery"
);

if (!fs.existsSync(galleryUploadPath)) {
    fs.mkdirSync(
        galleryUploadPath,
        {
            recursive: true,
        }
    );
}

const storage =
    multer.diskStorage({
        destination: (
            req,
            file,
            cb
        ) => {
            cb(
                null,
                galleryUploadPath
            );
        },

        filename: (
            req,
            file,
            cb
        ) => {
            const extension =
                path.extname(
                    file.originalname
                );

            const originalName =
                path
                    .basename(
                        file.originalname,
                        extension
                    )
                    .replace(
                        /[^a-zA-Z0-9-_]/g,
                        "-"
                    );

            const uniqueName =
                `${originalName}-${Date.now()}-${Math.round(
                    Math.random() * 1e9
                )}${extension}`;

            cb(
                null,
                uniqueName
            );
        },
    });

const fileFilter = (
    req,
    file,
    cb
) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
    ];

    if (
        allowedTypes.includes(
            file.mimetype
        )
    ) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPG, JPEG, PNG, WEBP and GIF images are allowed"
            ),
            false
        );
    }
};

const uploadGallery =
    multer({
        storage,
        fileFilter,

        limits: {
            fileSize:
                5 * 1024 * 1024,
        },
    });

export default uploadGallery;