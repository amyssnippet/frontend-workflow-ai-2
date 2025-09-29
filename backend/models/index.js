const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const crypto = require('crypto');

const generate18DigitId = () => {
    return Math.floor(Math.random() * 9e17 + 1e17).toString();
};

// Flowchart related models
const Flowchart = sequelize.define('Flowchart', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generate18DigitId
    },
    title: { 
        type: DataTypes.STRING, 
        defaultValue: 'Untitled Flowchart' 
    },
    mermaidCode: { 
        type: DataTypes.TEXT, 
        allowNull: false 
    },
    description: DataTypes.TEXT,
    imageUrl: DataTypes.STRING,
    isPublic: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    tags: DataTypes.JSON, // Array of tags
    viewCount: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
    },
    createdAt: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    },
    updatedAt: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    }
}, { timestamps: true });

const FlowchartVersion = sequelize.define('FlowchartVersion', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generate18DigitId
    },
    version: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    mermaidCode: { 
        type: DataTypes.TEXT, 
        allowNull: false 
    },
    changeDescription: DataTypes.TEXT,
    createdAt: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    }
}, { timestamps: false });

const FlowchartTemplate = sequelize.define('FlowchartTemplate', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generate18DigitId
    },
    name: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    description: DataTypes.TEXT,
    category: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    mermaidCode: { 
        type: DataTypes.TEXT, 
        allowNull: false 
    },
    imageUrl: DataTypes.STRING,
    isPublic: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
    },
    usageCount: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
    },
    createdAt: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    }
}, { timestamps: true });

// Keep your existing models
const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generate18DigitId
    },
    role: { type: DataTypes.ENUM('user', 'assistant'), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false });

const Chat = sequelize.define('Chat', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generate18DigitId
    },
    title: { type: DataTypes.STRING, defaultValue: 'New Chat' },
}, { timestamps: true });

const RequestLog = sequelize.define('RequestLog', {
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ip: DataTypes.STRING,
    model: DataTypes.STRING,
    prompt: DataTypes.TEXT,
    instructions: DataTypes.TEXT,
    response: DataTypes.TEXT,
    totalTokensUsed: DataTypes.INTEGER,
    processingTime: DataTypes.INTEGER, // milliseconds
    success: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: false });

const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generate18DigitId
    },
    fullName: DataTypes.STRING,
    email: { type: DataTypes.STRING, allowNull: false },
    profile: DataTypes.TEXT,
    password: { type: DataTypes.STRING, allowNull: true },
    provider: { type: DataTypes.STRING },
    providerId: { type: DataTypes.STRING },
    count: { type: DataTypes.INTEGER, defaultValue: 4000 },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    isDeveloper: { type: DataTypes.BOOLEAN, defaultValue: false },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: false });

const Otp = sequelize.define('Otp', {
    otp: { type: DataTypes.STRING, allowNull: false },
    otpExpiry: { type: DataTypes.DATE, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false });

const UserSubscription = sequelize.define('UserSubscription', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generate18DigitId
    },
    razorpaySubscriptionId: { type: DataTypes.STRING, allowNull: false },
    status: { 
        type: DataTypes.ENUM('active', 'cancelled', 'expired', 'paused'), 
        defaultValue: 'active' 
    },
    startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    endDate: DataTypes.DATE,
    tokensUsed: { type: DataTypes.INTEGER, defaultValue: 0 },
    apiCallsUsed: { type: DataTypes.INTEGER, defaultValue: 0 },
    razorpayPaymentId: DataTypes.STRING,
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: true });

const PaymentHistory = sequelize.define('PaymentHistory', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generate18DigitId
    },
    razorpayPaymentId: { type: DataTypes.STRING, allowNull: false },
    razorpayOrderId: DataTypes.STRING,
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING, defaultValue: 'INR' },
    status: { 
        type: DataTypes.ENUM('created', 'authorized', 'captured', 'refunded', 'failed'), 
        defaultValue: 'created' 
    },
    paymentMethod: DataTypes.STRING,
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false });

// Associations
User.hasMany(Flowchart);
Flowchart.belongsTo(User);

User.hasMany(Chat);
Chat.belongsTo(User);

Chat.hasMany(Message);
Message.belongsTo(Chat);

Flowchart.hasMany(FlowchartVersion);
FlowchartVersion.belongsTo(Flowchart);

User.hasMany(FlowchartTemplate);
FlowchartTemplate.belongsTo(User);

User.hasMany(Otp);
Otp.belongsTo(User);

User.hasMany(UserSubscription);
UserSubscription.belongsTo(User);

User.hasMany(PaymentHistory);
PaymentHistory.belongsTo(User);

UserSubscription.hasMany(PaymentHistory);
PaymentHistory.belongsTo(UserSubscription);

User.hasMany(RequestLog);
RequestLog.belongsTo(User);

module.exports = { 
    sequelize, 
    User, 
    Chat, 
    Message, 
    RequestLog, 
    Otp, 
    UserSubscription, 
    PaymentHistory,
    Flowchart,
    FlowchartVersion,
    FlowchartTemplate
};
