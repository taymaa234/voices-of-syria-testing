package com.paltform.VoicesOfSyria.Repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.paltform.VoicesOfSyria.Enum.UserRole;
import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Model.User;

public interface UserRepo extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    User findByName(String name);


    User findByStories(List<Story> stories);

    User findByProfileImageUrl(String profileImageUrl);

    User findByPassword(String password);

    User findByEmailAndPassword(String email, String password);

    User findByEmailAndPasswordAndRole(String email, String password, UserRole role);

    List<User> findByRole(UserRole role);

    boolean existsByRole(UserRole role);
}
