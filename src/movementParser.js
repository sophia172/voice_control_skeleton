/**
 * Utility class to parse movement commands from natural language
 * and convert them to skeleton joint movements
 */
class MovementParser {
  constructor() {
    // Define keywords for joints
    this.jointKeywords = {
      head: ['head', 'neck', 'face'],
      leftShoulder: ['left shoulder', 'left arm'],
      rightShoulder: ['right shoulder', 'right arm'],
      leftElbow: ['left elbow', 'left forearm'],
      rightElbow: ['right elbow', 'right forearm'],
      leftWrist: ['left wrist', 'left hand'],
      rightWrist: ['right wrist', 'right hand'],
      leftHip: ['left hip'],
      rightHip: ['right hip'],
      leftKnee: ['left knee', 'left leg'],
      rightKnee: ['right knee', 'right leg'],
      leftAnkle: ['left ankle', 'left foot'],
      rightAnkle: ['right ankle', 'right foot'],
      spine: ['back', 'spine', 'torso', 'body'],
      hips: ['hips', 'waist', 'pelvis']
    };

    // Define keywords for directions and axes
    this.directionKeywords = {
      up: { axis: 'y', value: 1 },
      down: { axis: 'y', value: -1 },
      left: { axis: 'x', value: -1 },
      right: { axis: 'x', value: 1 },
      forward: { axis: 'z', value: -1 },
      backward: { axis: 'z', value: 1 },
      clockwise: { axis: 'y', value: -1 },
      counterclockwise: { axis: 'y', value: 1 },
      bend: { axis: 'x', value: 1 },
      straighten: { axis: 'x', value: -1 },
      rotate: { axis: 'y', value: 1 },
      twist: { axis: 'z', value: 1 }
    };

    // Define keywords for magnitude
    this.magnitudeKeywords = {
      slightly: 15,
      little: 20,
      bit: 20,
      somewhat: 30,
      partially: 45,
      halfway: 45,
      moderately: 60,
      significantly: 75,
      fully: 90,
      completely: 90,
      all: 90,
      maximum: 90
    };
  }

  /**
   * Parse a natural language command into joint movements
   * @param {string} command - The natural language command
   * @returns {Array} Array of movement objects with joint, axis, and angle
   */
  parseCommand(command) {
    const lowerCommand = command.toLowerCase();
    const movements = [];

    // Check for reset command
    if (lowerCommand.includes('reset') || 
        lowerCommand.includes('start over') || 
        lowerCommand.includes('initial position')) {
      return [{ type: 'reset' }];
    }

    // Iterate through joint keywords to find matches
    for (const [jointName, keywords] of Object.entries(this.jointKeywords)) {
      if (keywords.some(keyword => lowerCommand.includes(keyword))) {
        // Found a joint reference, now look for direction
        let direction = null;
        let axis = 'y'; // Default axis
        let magnitude = 30; // Default angle in degrees

        // Find direction
        for (const [dirName, dirInfo] of Object.entries(this.directionKeywords)) {
          if (lowerCommand.includes(dirName)) {
            direction = dirName;
            axis = dirInfo.axis;
            magnitude *= dirInfo.value; // Apply direction sign
            break;
          }
        }

        // Find magnitude if specified
        for (const [magName, magValue] of Object.entries(this.magnitudeKeywords)) {
          if (lowerCommand.includes(magName)) {
            magnitude = magValue * (magnitude < 0 ? -1 : 1); // Preserve sign
            break;
          }
        }

        // If we found a direction, add the movement
        if (direction) {
          movements.push({
            type: 'move',
            joint: jointName,
            axis: axis,
            angle: magnitude
          });
        }
      }
    }

    // Handle special cases and complex movements
    if (lowerCommand.includes('wave')) {
      if (lowerCommand.includes('left hand') || lowerCommand.includes('left arm')) {
        movements.push(
          { type: 'move', joint: 'leftShoulder', axis: 'y', angle: 45 },
          { type: 'move', joint: 'leftElbow', axis: 'z', angle: 45 }
        );
      } else if (lowerCommand.includes('right hand') || lowerCommand.includes('right arm')) {
        movements.push(
          { type: 'move', joint: 'rightShoulder', axis: 'y', angle: -45 },
          { type: 'move', joint: 'rightElbow', axis: 'z', angle: -45 }
        );
      }
    }

    if (lowerCommand.includes('nod')) {
      movements.push({ type: 'move', joint: 'head', axis: 'x', angle: 20 });
    }

    if (lowerCommand.includes('shake head')) {
      movements.push({ type: 'move', joint: 'head', axis: 'y', angle: 20 });
    }

    return movements;
  }
}

export default MovementParser; 