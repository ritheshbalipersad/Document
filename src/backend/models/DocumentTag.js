module.exports = (sequelize, DataTypes) => {
  const DocumentTag = sequelize.define('DocumentTag', {
    documentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Documents',
        key: 'id'
      }
    },
    tagId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tags',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'DocumentTags'
  });

  return DocumentTag;
};