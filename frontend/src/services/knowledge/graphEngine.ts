import { CareerKnowledgeGraph, GraphNode, GraphRelationship, UnifiedUserProfile } from '@/types/profile';
import { logger } from '@/services/logger';

export const graphEngine = {
  /**
   * Generates a CareerKnowledgeGraph representation from a UnifiedUserProfile projection.
   */
  buildGraph(profile: UnifiedUserProfile): CareerKnowledgeGraph {
    const nodes: Record<string, GraphNode> = {};
    const relationships: GraphRelationship[] = [];

    const userNodeId = `user_${profile.uid}`;
    nodes[userNodeId] = {
      id: userNodeId,
      type: 'User',
      properties: {
        fullName: profile.personalInfo.fullName.value,
        email: profile.personalInfo.email.value,
        location: profile.personalInfo.location.value,
        bio: profile.personalInfo.bio.value,
      },
    };

    // 1. Map Education Nodes & Relationships
    if (profile.education) {
      profile.education.forEach((edu, idx) => {
        const eduNodeId = `edu_${idx}_${profile.uid}`;
        nodes[eduNodeId] = {
          id: eduNodeId,
          type: 'Education',
          properties: {
            institution: edu.institution,
            degree: edu.degree,
            stream: edu.stream,
            graduationYear: edu.graduationYear,
          },
        };

        relationships.push({
          id: `rel_user_edu_${idx}`,
          sourceId: userNodeId,
          targetId: eduNodeId,
          type: 'HAS_EDUCATION',
          properties: {},
        });
      });
    }

    // 2. Map Skill Nodes & Relationships
    if (profile.skills) {
      profile.skills.forEach((skill, idx) => {
        const skillNodeId = `skill_${skill.name.toLowerCase().replace(/\s+/g, '_')}`;
        nodes[skillNodeId] = {
          id: skillNodeId,
          type: 'Skill',
          properties: {
            name: skill.name,
            confidence: skill.confidence,
            experienceLevel: skill.experienceLevel,
          },
        };

        relationships.push({
          id: `rel_user_skill_${idx}`,
          sourceId: userNodeId,
          targetId: skillNodeId,
          type: 'HAS_SKILL',
          properties: {
            confidence: skill.confidence,
            source: skill.source,
          },
        });
      });
    }

    // 3. Map Project Nodes & Relationships
    if (profile.projects) {
      profile.projects.forEach((proj, idx) => {
        const projNodeId = `proj_${idx}_${profile.uid}`;
        nodes[projNodeId] = {
          id: projNodeId,
          type: 'Project',
          properties: {
            title: proj.title,
            description: proj.description,
            technologies: proj.technologies,
          },
        };

        relationships.push({
          id: `rel_user_proj_${idx}`,
          sourceId: userNodeId,
          targetId: projNodeId,
          type: 'COMPLETED',
          properties: {},
        });

        // Relate projects to skills
        proj.technologies.forEach((tech) => {
          const skillNodeId = `skill_${tech.toLowerCase().replace(/\s+/g, '_')}`;
          if (nodes[skillNodeId]) {
            relationships.push({
              id: `rel_proj_${idx}_skill_${tech}`,
              sourceId: projNodeId,
              targetId: skillNodeId,
              type: 'BUILT_IN',
              properties: {},
            });
          }
        });
      });
    }

    // 4. Map Experience Nodes & Relationships
    if (profile.experience) {
      profile.experience.forEach((exp, idx) => {
        const expNodeId = `exp_${idx}_${profile.uid}`;
        nodes[expNodeId] = {
          id: expNodeId,
          type: 'Experience',
          properties: {
            company: exp.company,
            role: exp.role,
            duration: exp.duration,
            description: exp.description,
          },
        };

        relationships.push({
          id: `rel_user_exp_${idx}`,
          sourceId: userNodeId,
          targetId: expNodeId,
          type: 'WORKED_AT',
          properties: {},
        });
      });
    }

    // 5. Map Career Goals
    if (profile.careerGoals?.preferredRoles?.value) {
      profile.careerGoals.preferredRoles.value.forEach((role, idx) => {
        const goalNodeId = `goal_${idx}_${profile.uid}`;
        nodes[goalNodeId] = {
          id: goalNodeId,
          type: 'CareerGoal',
          properties: {
            preferredRole: role,
          },
        };

        relationships.push({
          id: `rel_user_goal_${idx}`,
          sourceId: userNodeId,
          targetId: goalNodeId,
          type: 'TARGETING_ROLE',
          properties: {},
        });
      });
    }

    logger.info(`[GraphEngine] Built Knowledge Graph with ${Object.keys(nodes).length} nodes and ${relationships.length} relationships for user ${profile.uid}`);

    return {
      uid: profile.uid,
      nodes,
      relationships,
    };
  }
};

export default graphEngine;
