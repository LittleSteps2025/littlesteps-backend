import Parent from '../models/parentModel.js';
import Child from '../models/childModel.js';
import { v4 as uuidv4 } from 'uuid';

class ChildController {
  async addChild(req, res) {
    try {
      const {
        name, age, gender, dob, group_id, image, bc, blood_type, mr, allergies, package_id,
        parentName, parentNIC, parentEmail, parentAddress, parentContact
      } = req.body;

      // Find or create parent
      let parent = await Parent.findOne({ parentNIC });
      if (!parent) {
        parent = new Parent({
          parent_id: uuidv4(),
          parentName,
          parentNIC,
          parentEmail,
          parentAddress,
          parentContact,
          password: 'default123', // Set a default or generate
          user_id: uuidv4(),
          token: '',
          verified: false,
          noti_count: 0
        });
        await parent.save();
      }

      // Create child
      const child = new Child({
        child_id: uuidv4(),
        parent_id: parent.parent_id,
        name,
        age,
        gender,
        dob,
        group_id,
        image,
        bc,
        blood_type,
        mr,
        allergies,
        package_id
      });
      await child.save();

      res.status(201).json({ child, parent });
    } catch (error) {
      res.status(400).json({ message: 'Error adding child/parent', error });
    }
  }

  async getAllChildren(req, res) {
    try {
      const children = await Child.find().populate({ path: 'parent_id', model: Parent });
      res.status(200).json(children);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving children', error });
    }
  }
}

export default new ChildController();