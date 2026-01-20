// Default message templates
const templates = {
  simple: {
    id: 'simple',
    name: 'Simple Wish',
    message: 'Happy Birthday, {name}! 🎂 Wishing you a wonderful day!',
  },
  heartfelt: {
    id: 'heartfelt',
    name: 'Heartfelt Wish',
    message: 'Happy Birthday, {name}! 🎉 May this special day bring you endless joy, love, and all the happiness your heart can hold. Have an amazing year ahead!',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    message: 'Dear {name}, Wishing you a very Happy Birthday! May this year bring you success, good health, and happiness. Best regards!',
  },
  funny: {
    id: 'funny',
    name: 'Funny',
    message: "Happy Birthday, {name}! 🎂 They say age is just a number... but in your case, it's a pretty big number! 😄 Just kidding! Have an amazing day!",
  },
  family: {
    id: 'family',
    name: 'Family',
    message: 'Happy Birthday to my dear {name}! 💕 You mean the world to me. May your special day be filled with love, laughter, and all your favorite things. Love you always!',
  },
  friend: {
    id: 'friend',
    name: 'Friend',
    message: "Hey {name}! 🎉 Happy Birthday, buddy! Here's to another year of great memories and adventures. Let's celebrate! 🥳",
  },
};

// Get all templates
const getAllTemplates = () => {
  return Object.values(templates);
};

// Get template by ID
const getTemplate = (templateId) => {
  return templates[templateId] || templates.simple;
};

// Format message with contact data
const formatMessage = (template, contactData) => {
  let message = template;

  // Replace placeholders
  message = message.replace(/{name}/g, contactData.name || 'friend');
  message = message.replace(/{age}/g, contactData.age || '');
  message = message.replace(/{sender}/g, contactData.senderName || '');

  return message;
};

// Create custom message or use template
const createBirthdayMessage = (contact, user) => {
  // Use custom message if available
  if (contact.customMessage) {
    return formatMessage(contact.customMessage, {
      name: contact.name,
      age: contact.age + 1, // They're turning this age
      senderName: user.name,
    });
  }

  // Use user's default template
  if (user.settings && user.settings.defaultTemplate) {
    return formatMessage(user.settings.defaultTemplate, {
      name: contact.name,
      age: contact.age + 1,
      senderName: user.name,
    });
  }

  // Fall back to simple template
  return formatMessage(templates.simple.message, {
    name: contact.name,
    age: contact.age + 1,
    senderName: user.name,
  });
};

module.exports = {
  templates,
  getAllTemplates,
  getTemplate,
  formatMessage,
  createBirthdayMessage,
};
