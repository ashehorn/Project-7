-- CreateTable
CREATE TABLE `CommentMedia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `commentId` INTEGER NOT NULL,
    `media` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CommentMedia` ADD CONSTRAINT `CommentMedia_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `PostComments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
