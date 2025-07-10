import pool from '../../config/db.js';

class ChildModel {
    async findAll() {
        const { rows } = await pool.query('SELECT * FROM child');
        return rows;
    }
    async findById(child_id) {
        const { rows } = await pool.query('SELECT * FROM child WHERE child_id = $1', [child_id]);
        return rows[0];
    }
    async create(child) {
        const { parent_id, name, age, gender, dob, group_id, image, bc, blood_type, mr, allergies, created_at, package_id } = child;
        const { rows } = await pool.query(
            `INSERT INTO child (parent_id, name, age, gender, dob, group_id, image, bc, blood_type, mr, allergies, created_at, package_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [parent_id, name, age, gender, dob, group_id, image, bc, blood_type, mr, allergies, created_at, package_id]
        );
        return rows[0];
    }
    async update(child_id, child) {
        const { parent_id, name, age, gender, dob, group_id, image, bc, blood_type, mr, allergies, created_at, package_id } = child;
        const { rows } = await pool.query(
            `UPDATE child SET parent_id=$1, name=$2, age=$3, gender=$4, dob=$5, group_id=$6, image=$7, bc=$8, blood_type=$9, mr=$10, allergies=$11, created_at=$12, package_id=$13 WHERE child_id=$14 RETURNING *`,
            [parent_id, name, age, gender, dob, group_id, image, bc, blood_type, mr, allergies, created_at, package_id, child_id]
        );
        return rows[0];
    }
    async remove(child_id) {
        const { rowCount } = await pool.query('DELETE FROM child WHERE child_id = $1', [child_id]);
        return rowCount > 0;
    }
}

export default new ChildModel();